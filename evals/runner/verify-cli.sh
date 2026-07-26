#!/bin/sh
# Task 6 steps 5 and 5b: verify auth and the six CLI assumptions the code makes but the
# verified-facts table does not cover. MUST run from a normal terminal — nested `claude`
# invocations from inside a Claude Code session fail auth (keychain unreachable from the sandbox).
#
# Usage:  sh evals/runner/verify-cli.sh            # subscription auth, host hooks fire
#         ANTHROPIC_API_KEY=sk-... sh evals/runner/verify-cli.sh    # also tries isolated mode
#
# Every check prints PASS/FAIL plus the raw evidence, so a failure can be diagnosed without
# re-running. Record the outcomes under a "Verified CLI facts" heading in
# evals/operating-model/README.md, and fix anything that fails before the calibration run.
set -u
cd "$(dirname "$0")/../.." || exit 1
ROOT=$(pwd)
OUT=$(mktemp -d)
SUITE=evals/operating-model
SHA=$(cat $SUITE/arms/BASELINE_SHA)
SCHEMA='{"type":"object","properties":{"destination":{"type":"string"}},"required":["destination"],"additionalProperties":false}'
pass() { echo "PASS  $1"; }
fail() { echo "FAIL  $1"; }
note() { echo "      $1"; }

# A staged month-3 baseline tree, so the checks run against the real fixture.
DIR=$(node -e "
import('./evals/runner/stage.mjs').then(({stage})=>{
  const s = stage({suite:'$SUITE', arm:'baseline', world:'month-3', baselineSha:'$SHA'})
  console.log(s.dir)   // deliberately not cleaned up; this script removes it at the end
})")
echo "staged fixture: $DIR"
echo

# ---------------------------------------------------------------- step 5: auth
echo "== step 5: auth =="
claude -p 'Reply with only: ok' --model haiku --output-format stream-json --verbose > "$OUT/auth.jsonl" 2>"$OUT/auth.err"
COST=$(node -e "const l=require('fs').readFileSync('$OUT/auth.jsonl','utf8').trim().split('\n');const r=l.map(x=>{try{return JSON.parse(x)}catch{return{}}}).find(e=>e.type==='result');console.log(r?[r.subtype,r.total_cost_usd,r.num_turns].join(' '):'no-result')")
TEXT=$(node -e "const {parseStream}=await import('./evals/runner/invoke.mjs');console.log(parseStream(require('fs').readFileSync('$OUT/auth.jsonl','utf8')).answerText.slice(0,120))" --input-type=module 2>/dev/null)
note "result(subtype cost turns): $COST"
note "answer: $TEXT"
case "$TEXT" in
  *"Not logged in"*|"") fail "auth — no measurement is possible until this works"; echo; echo "Stopping: every later check would fail for the same reason."; rm -rf "$DIR" "$OUT"; exit 1 ;;
  *) pass "auth (assistant text is present and no login prompt)" ;;
esac
echo

# ---------------------------------------------------------------- 5b.1 tool suppression
echo "== 5b.1: does --allowedTools '' actually disable tools in a routing run? =="
SCHEMA="$SCHEMA" node --input-type=module -e "
const {invoke, composeRoutingPrompt} = await import('./evals/runner/invoke.mjs')
const p = await invoke({dir:'$DIR', prompt: composeRoutingPrompt('$DIR','A one-line change just settled how this app rounds: half-up when formatted, stored values never rounded.'),
  model:'haiku', family:'routing', caps:{budgetUsd:0.5, timeoutMs:120000}, jsonSchema:process.env.SCHEMA, isolated:false})
require('fs').writeFileSync('$OUT/routing.json', JSON.stringify(p,null,1))
console.log('tool_use events:', p.toolCalls.length, '| answer:', JSON.stringify(p.answerText.slice(0,200)))
console.log('hook events:', p.hookEvents, '| model:', p.model, '| result:', p.result && p.result.subtype)
" 2>&1 | tee "$OUT/routing.log"
TOOLS=$(grep -o 'tool_use events: [0-9]*' "$OUT/routing.log" | grep -o '[0-9]*$')
[ "$TOOLS" = "0" ] && pass "no tool calls in a routing run" || fail "$TOOLS tool call(s) leaked — find the real flag (--disallowedTools, or --permission-mode with an empty allowlist)"
echo

# ---------------------------------------------------------------- 5b.2 structured output shape
echo "== 5b.2: does --json-schema output arrive as assistant text? =="
if grep -q '"destination"' "$OUT/routing.log"; then
  pass "the JSON object reached answerText, which is where grade() reads it"
else
  fail "no destination field in assistant text — every routing run would grade 'error'"
  note "inspect $OUT/routing.json for where the structured answer actually landed"
fi
echo

# ---------------------------------------------------------------- 5b.3 init event carries .model
echo "== 5b.3: does system/init carry .model? =="
MODEL=$(grep -o 'model: [^ |]*' "$OUT/routing.log" | head -1 | cut -d' ' -f2)
[ -n "$MODEL" ] && [ "$MODEL" != "null" ] && pass "resolved model id: $MODEL" || fail "no model id — model drift becomes untraceable in the ledger"
echo

# ---------------------------------------------------------------- 5b.4 budget exhaustion subtype
echo "== 5b.4: how does budget exhaustion surface? =="
claude -p 'Count slowly from 1 to 500, one number per line, no other text.' --model haiku \
  --output-format stream-json --verbose --max-budget-usd 0.001 > "$OUT/budget.jsonl" 2>&1
SUB=$(node -e "const l=require('fs').readFileSync('$OUT/budget.jsonl','utf8').trim().split('\n');const r=l.map(x=>{try{return JSON.parse(x)}catch{return{}}}).filter(e=>e.type==='result').pop();console.log(r?r.subtype:'no-result')")
note "result subtype under an exhausted budget: $SUB"
[ "$SUB" != "success" ] && pass "a cap-hit is distinguishable from success, so grade() can score it 'error'" \
  || fail "cap-hits report success — cap-hits would score 'fail', reintroducing treatment-correlated censoring"
echo

# ---------------------------------------------------------------- 5b.5 non-zero cost in fallback mode
echo "== 5b.5: is total_cost_usd non-zero under subscription auth? =="
C=$(node -e "const l=require('fs').readFileSync('$OUT/auth.jsonl','utf8').trim().split('\n');const r=l.map(x=>{try{return JSON.parse(x)}catch{return{}}}).find(e=>e.type==='result');console.log(r?r.total_cost_usd:'?')")
note "total_cost_usd: $C"
node -e "process.exit(Number('$C')>0?0:1)" && pass "non-zero, so isBroken's zero-cost heuristic does not blanket-error real runs" \
  || fail "zero cost under subscription auth — isBroken would reject every run; relax the heuristic to num_turns<=1 plus the login-text match"
echo

# ---------------------------------------------------------------- 5b.6 isolated mode
echo "== 5b.6: does --setting-sources project suppress hooks and still load the project CLAUDE.md? =="
if [ -n "${ANTHROPIC_API_KEY:-}" ]; then
  claude -p 'Quote the first line of this project CLAUDE.md verbatim, and nothing else.' --model haiku \
    --output-format stream-json --verbose --setting-sources project > "$OUT/iso.jsonl" 2>&1
  HOOKS=$(grep -c '"subtype":"hook' "$OUT/iso.jsonl")
  if grep -q 'Ledger' "$OUT/iso.jsonl"; then pass "the project CLAUDE.md still reaches the model in isolated mode"
  else fail "the project CLAUDE.md did NOT reach the model — bundle B's behavioral channel would be dead"; fi
  [ "$HOOKS" = "0" ] && pass "no hook events: isolated mode is clean" || fail "$HOOKS hook event(s) still fired"
  note "run this one with cwd inside the staged fixture for a true reading; see $OUT/iso.jsonl"
else
  fail "skipped: ANTHROPIC_API_KEY is not set"
  note "Without it, --setting-sources project breaks auth (verified fact), so the suite runs in"
  note "fallback mode and run.mjs requires --allow-contaminated. Host hooks then fire in every run:"
  note "arm-invariant contamination, but the skills gate may push the model to read more and mask bundle B."
fi
echo
echo "artifacts: $OUT"
rm -rf "$DIR"
