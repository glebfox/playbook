# Operating-Model Eval Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a repeatable suite that measures whether an edit to `harness/operating-model.md` changes agent behavior, and run it across five document arms on two model tiers.

**Architecture:** A frozen synthetic project (the fixture) is copied to a temp directory per run; an *arm* materializes both a patched copy of the operating model and the fixture files that instantiate its prescriptions; the `claude` CLI runs one case in that directory in print mode with stream-json output; a grader decides pass/fail/error mechanically from the answer text or the tool-call log. No LLM judge anywhere.

**Tech Stack:** Node 24 (ESM `.mjs`, `node:test`, no dependencies), POSIX shell for the fixture's git history, `claude` CLI in print mode, `git apply` for arm patches.

Design of record: [DESIGN.md](DESIGN.md). Where this plan and the design disagree, the design is wrong and was written earlier — but say so rather than diverging silently.

## Global Constraints

- Node 24+, ESM only (`.mjs`). **No npm dependencies, no `package.json`.** Tests run with `node --test`.
- All content in English, including fixture documents and case prompts.
- Markdown in this repository is **not hard-wrapped** — one line per paragraph, list item, and table row.
- `--output-format stream-json` **requires** `--verbose` when used with `-p`. Verified: without it the CLI exits with `Error: When using --print, --output-format=stream-json requires --verbose`.
- There is **no `--max-turns` flag.** Caps are `--max-budget-usd <amount>` plus a runner-side wall-clock timeout.
- Model aliases for `--model`: `opus`, `haiku`. Resolved model IDs are read from the `system`/`init` event and recorded per run.
- Never write to `harness/operating-model.md` in any task of this plan. Applying the nine edits is out of scope here; it happens after the measurement.
- Commit after every task. Branch: `evals-suite-design` (already checked out).

## Verified CLI facts

These were smoke-tested before this plan was written. Do not re-derive them; do not trust memory over them.

| Fact | Consequence |
|---|---|
| `-p --output-format stream-json` errors without `--verbose` | every invocation carries `--verbose` |
| Stream events: `{"type":"system","subtype":"init"\|"hook_started"\|"hook_response"}`, `{"type":"assistant","message":{"content":[…]}}`, `{"type":"result","subtype":…,"num_turns":N,"total_cost_usd":N}` | the parser keys off `type`, and tool calls are `content[]` blocks with `type:"tool_use"`, `name`, `input` |
| Host hooks fire inside nested runs (6 hook events observed) | host hooks inject instructions into every eval run — see Task 6 |
| `--setting-sources project` suppresses host hooks **and breaks auth** ("Not logged in") because credentials live in user settings | full isolation requires `ANTHROPIC_API_KEY`; see Task 6 |
| A failed-auth run reports `result.subtype = "success"`, `num_turns = 1`, `total_cost_usd = 0`, body text `Not logged in · Please run /login` | the grader **must** assert a sanity signal or a broken run scores as a real answer |
| `--json-schema '<schema>'` provides structured-output validation | routing answers are a validated object, not a parsed last line — see Task 4 |
| `--safe-mode` disables CLAUDE.md, skills, plugins, hooks together | too coarse: behavioral cases need the fixture's `CLAUDE.md` discovered normally |

## File structure

| Path | Responsibility |
|---|---|
| `evals/README.md` | what suites exist, how to run one |
| `evals/runner/stage.mjs` | temp-dir staging: copy fixture, run `history.sh`, materialize an arm, run the self-check |
| `evals/runner/invoke.mjs` | build and execute one `claude` command; parse stream-json into a normalized event log |
| `evals/runner/grade.mjs` | verdict from a normalized log + a case's `grade` block; `--self-check` mode against `results/golden/` |
| `evals/runner/run.mjs` | CLI entry: expand the sparse matrix, drive stage → invoke → grade, write results |
| `evals/runner/report.mjs` | per-tier tables, per-bundle deltas, the two call-outs |
| `evals/runner/schema.mjs` | the case schema and its validator, shared by `run.mjs` and `validate.mjs` |
| `evals/runner/validate.mjs` | standalone: validate every case file in a suite against the schema |
| `evals/operating-model/fixture/ledger/**` | the synthetic project, month-3 world, arm-independent content only |
| `evals/operating-model/fixture/history.sh` | builds the shaped git history and writes real shas into specs |
| `evals/operating-model/fixture/day-1.whitelist` | the file list that defines the `day-1` world |
| `evals/operating-model/arms/0{1,2,3}-*.patch` | document hunks **and** `CLAUDE.md` instantiation per bundle |
| `evals/operating-model/arms/all.checklist` | the nine-edit presence checklist hand-checked against the `ALL` diff |
| `evals/operating-model/cases/routing/*.md` | 12 routing cases |
| `evals/operating-model/cases/behavioral/*.md` | 4 behavioral cases |

Files that change together live together: the runner is generic and lives once; everything suite-specific lives under `evals/operating-model/`.

---

# Phase 1 — verifiable by inspection

Nothing in this phase calls a model. Its deliverables are checked by `git log`, a schema validator, and reading a diff. **Stop at the end of Task 4 for review** before building anything that spends tokens.

---

### Task 1: Fixture — the month-3 world

**Files:**
- Create: `evals/operating-model/fixture/ledger/ARCHITECTURE.md`
- Create: `evals/operating-model/fixture/ledger/docs/vision.md`
- Create: `evals/operating-model/fixture/ledger/docs/roadmap.md`
- Create: `evals/operating-model/fixture/ledger/docs/conventions.md`
- Create: `evals/operating-model/fixture/ledger/docs/guidelines/testing.md`
- Create: `evals/operating-model/fixture/ledger/docs/guidelines/nextjs-runtime.md`
- Create: `evals/operating-model/fixture/ledger/docs/decisions/0004-money-integer-cents.md`
- Create: `evals/operating-model/fixture/ledger/docs/decisions/0009-import-key.md`
- Create: `evals/operating-model/fixture/ledger/docs/specs/domains/transaction.md`
- Create: `evals/operating-model/fixture/ledger/docs/specs/domains/budget.md`
- Create: `evals/operating-model/fixture/ledger/docs/tests/domains/transaction.md`
- Create: `evals/operating-model/fixture/ledger/docs/increments/completed/2026-05-12-recurring-transactions/{design.md,plan.md}`
- Create: `evals/operating-model/fixture/ledger/{app/transactions/page.tsx,domain/transaction/{rules.ts,index.ts},lib/money.ts,db/schema.ts,package.json}`
- Create: `evals/operating-model/fixture/day-1.whitelist`
- Create: `evals/operating-model/fixture/assert-fixture.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: a directory tree at `fixture/ledger/`. Every later task depends on the *facts* asserted by `assert-fixture.mjs`, not on prose wording.

Two files are lifted from the panel review rather than authored fresh — copy them verbatim, they are already realistic and measured:
`/private/tmp/claude-502/-Users-gorelov-Developer-Other-playbook/1e2ffbb1-749d-4f00-aa39-c33a11f6c25f/scratchpad/s4-month3/ARCHITECTURE.md`, `.../s4-month3/docs/specs/domains/transaction.md`, `.../s4-month3/docs/tests/domains/transaction.md`, `.../s4-month3/docs/decisions/0004-money-integer-cents.md`. **Copy these first** — the scratchpad is session-scoped and will be deleted.

The prose files are written to a target length, but what makes them correct is the fact list below. These facts are load-bearing: a case's expected answer depends on each one, so `assert-fixture.mjs` checks them mechanically.

| File | Required facts | Needed by |
|---|---|---|
| `ARCHITECTURE.md` | a `## Conventions` list whose first entry is integer cents with a `see decision 0004` pointer; entries for `domain/` not importing `services/`, and errors crossing boundaries as result unions; a `## Layout` block naming `app/`, `domain/`, `lib/`, `db/`; a `## Commands` block. No mention of rounding, and no mention of Server Actions. | r01, r02, r09, b04 |
| `docs/vision.md` | scope split MVP vs future; increment descriptions; a "still unbuilt" section that does **not** mention multi-currency | r05, r08 |
| `docs/roadmap.md` | per-increment status lines; a future-backlog section that does **not** mention multi-currency | r08 |
| `docs/conventions.md` | commit-message format stated explicitly | r11 |
| `docs/guidelines/nextjs-runtime.md` | the node-vs-edge runtime constraint, and that streaming upload parsing requires the node runtime | r03, b02 |
| `docs/guidelines/testing.md` | test stack and run command; no per-unit coverage rows | r10 |
| `docs/decisions/0004-*.md` | Status/Context/Decision/Consequences; `NUMERIC` + `decimal.js` rejected, with the Drizzle-returns-string and Server-Action-boundary reasons | r09, b01 |
| `docs/decisions/0009-import-key.md` | `importKey = hash(account, date, amount, description)` chosen over the bank-provided id; states the partial unique index | r07 |
| `docs/specs/domains/transaction.md` | 7 behaviors + 3 invariants; one invariant is "rejects zero amounts"; an "Extension points" section naming `domain/transaction/rules.ts`; **no** `Source:`/`Reconciled:` headers | r04, r07, r12, b01, b03 |
| `docs/specs/domains/budget.md` | a behavior where **zero is a legitimate limit**, stated in those terms | r04 |
| `docs/tests/domains/transaction.md` | 12 coverage rows, at least 3 of them explicit gaps with reasons; a pointer to `docs/guidelines/testing.md`; **no** row for re-categorization idempotence | r10 |
| `lib/money.ts` | `formatMoney` and `parseMoney` signatures; a comment that rounding behavior is unspecified | r01 |
| `domain/transaction/rules.ts` | a `rejectZeroAmount` guard signature | r04 |

- [ ] **Step 1: Verify the rescued content is present — it was copied out of a session-scoped scratchpad at plan time**

Four measured fixture files and the three panel reports were already vendored, because the scratchpad they lived in disappears with its session and the reports carry the **exact replacement wording for all nine edits** (needed by Task 3) plus the provenance every case's `finding` field cites.

```bash
ls evals/operating-model/reference/
ls evals/operating-model/fixture/ledger/ evals/operating-model/fixture/ledger/docs/*/*
```

Expected: `review-{skeptic,advocate,practitioner}.md` and two `day-1-*.md` files under `reference/`; `ARCHITECTURE.md`, `docs/specs/domains/transaction.md`, `docs/tests/domains/transaction.md`, `docs/decisions/0004-money-integer-cents.md` under `fixture/ledger/`. Measured sizes for reference: `ARCHITECTURE.md` 48 lines / 514 tokens, the spec 42 / 510, the test doc 18 / 317, the decision 26 / 547 — match these when authoring the rest.

`reference/day-1-ARCHITECTURE.md` and `reference/day-1-CLAUDE.md` are the panel's day-1 artifacts; use them as the shape for the `day-1` world, not as fixture content directly.

- [ ] **Step 2: Write the failing fixture assertion**

Create `evals/operating-model/fixture/assert-fixture.mjs`:

```javascript
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = process.argv[2] ?? new URL('./ledger/', import.meta.url).pathname
const read = p => existsSync(join(root, p)) ? readFileSync(join(root, p), 'utf8') : null

// [file, description, predicate] — every entry is a fact some case depends on
const FACTS = [
  ['ARCHITECTURE.md', 'integer-cents convention cites decision 0004', s => /integer cents/i.test(s) && /decision 0004/.test(s)],
  ['ARCHITECTURE.md', 'no rounding statement (r01 must have no home yet)', s => !/round/i.test(s)],
  ['ARCHITECTURE.md', 'no Server Actions statement (r02 must have no home yet)', s => !/server action/i.test(s)],
  ['ARCHITECTURE.md', 'layout block names app/, domain/, lib/, db/', s => ['app/', 'domain/', 'lib/', 'db/'].every(d => s.includes(d))],
  ['docs/vision.md', 'does not mention multi-currency (r08 target is empty)', s => !/multi-currenc/i.test(s)],
  ['docs/roadmap.md', 'does not mention multi-currency', s => !/multi-currenc/i.test(s)],
  ['docs/conventions.md', 'states a commit message format', s => /commit/i.test(s)],
  ['docs/guidelines/nextjs-runtime.md', 'states the node-vs-edge constraint', s => /edge/i.test(s) && /node/i.test(s)],
  ['docs/decisions/0004-money-integer-cents.md', 'records the rejected NUMERIC alternative', s => /NUMERIC/.test(s) && /decimal/i.test(s)],
  ['docs/decisions/0009-import-key.md', 'records the partial unique index', s => /partial unique index/i.test(s)],
  ['docs/specs/domains/transaction.md', 'invariant: rejects zero amounts', s => /zero amount/i.test(s)],
  ['docs/specs/domains/transaction.md', 'no reconcile headers in the arm-independent fixture', s => !/^Reconciled:/m.test(s) && !/^Source:/m.test(s)],
  ['docs/specs/domains/budget.md', 'zero is a legitimate limit', s => /zero/i.test(s) && /limit/i.test(s)],
  ['docs/tests/domains/transaction.md', 'has explicit gap rows', s => /not verified|not tested/i.test(s)],
  ['docs/tests/domains/transaction.md', 'no re-categorization row (r10 must have no home yet)', s => !/re-categoriz/i.test(s)],
  ['lib/money.ts', 'formatMoney signature present', s => /formatMoney/.test(s)],
  ['domain/transaction/rules.ts', 'rejectZeroAmount guard present', s => /rejectZeroAmount/.test(s)],
]

let failed = 0
for (const [file, desc, pred] of FACTS) {
  const s = read(file)
  const ok = s !== null && pred(s)
  if (!ok) { failed++; console.error(`FAIL ${file}: ${desc}${s === null ? ' (file missing)' : ''}`) }
}
console.log(failed === 0 ? `OK ${FACTS.length} facts` : `${failed}/${FACTS.length} facts failed`)
process.exit(failed === 0 ? 0 : 1)
```

- [ ] **Step 3: Run it to confirm it fails**

Run: `node evals/operating-model/fixture/assert-fixture.mjs`
Expected: non-zero exit, several `FAIL` lines for files not yet authored.

- [ ] **Step 4: Author the remaining fixture files until the assertion passes**

Write every file in the **Files** list not covered by Step 1, satisfying the fact table. Sizes to aim for: `vision.md` ~1100 tokens, `guidelines/*` ~600 each, `roadmap.md` ~350, `conventions.md` ~225, `budget.md` ~400, the completed increment's two files ~400 combined. Code files are signatures plus a one-line doc comment each; `package.json` names Next 15, React 19, `drizzle-orm`, `next-auth` and nothing else.

`day-1.whitelist`, one path per line — this world is built by whitelist, never by deleting from month-3:

```text
CLAUDE.md
docs/operating-model.md
docs/vision.md
docs/roadmap.md
docs/conventions.md
ARCHITECTURE.md
package.json
```

- [ ] **Step 5: Run the assertion until green**

Run: `node evals/operating-model/fixture/assert-fixture.mjs`
Expected: `OK 17 facts`, exit 0.

- [ ] **Step 6: Commit**

```bash
git add evals/operating-model/fixture
git commit -m "feat: add Ledger fixture for operating-model evals"
```

---

### Task 2: Fixture — the shaped git history

**Files:**
- Create: `evals/operating-model/fixture/history.sh`
- Create: `evals/operating-model/fixture/assert-history.mjs`

**Interfaces:**
- Consumes: a staged copy of `fixture/ledger/` in a working directory.
- Produces: a git repository in that directory whose HEAD contains commits touching `domain/transaction/**` **after** the sha written into `docs/specs/domains/transaction.md`'s `Reconciled:` header. Called by `stage.mjs` as `sh history.sh <dir> <inject-markers:0|1>`.

The second argument exists because reconcile markers are arm-owned: arms `B` and `ALL` pass `1`, everything else passes `0`. The sha can only be known after the commit, so the script writes it rather than the fixture storing it.

- [ ] **Step 1: Write the failing history assertion**

Create `evals/operating-model/fixture/assert-history.mjs`:

```javascript
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const dir = process.argv[2]
const wantMarkers = process.argv[3] === '1'
const git = (...a) => execFileSync('git', ['-C', dir, ...a], { encoding: 'utf8' }).trim()

const spec = readFileSync(join(dir, 'docs/specs/domains/transaction.md'), 'utf8')
const marker = spec.match(/^Reconciled:\s*\S+\s*\(([0-9a-f]{7,40})\)/m)

if (!wantMarkers) {
  if (marker) { console.error('FAIL marker present but this arm must not have one'); process.exit(1) }
  const n = git('rev-list', '--count', 'HEAD')
  console.log(`OK no markers, ${n} commits`)
  process.exit(0)
}
if (!marker) { console.error('FAIL no Reconciled marker written'); process.exit(1) }

const drift = git('log', '--oneline', `${marker[1]}..HEAD`, '--', 'domain/transaction')
if (!drift) { console.error(`FAIL no drift: nothing touches domain/transaction after ${marker[1]}`); process.exit(1) }
console.log(`OK marker ${marker[1]}, drift commits:\n${drift}`)
```

- [ ] **Step 2: Run it against an unstaged directory to confirm it fails**

```bash
rm -rf /tmp/fx && cp -R evals/operating-model/fixture/ledger /tmp/fx && git -C /tmp/fx init -q
node evals/operating-model/fixture/assert-history.mjs /tmp/fx 1
```

Expected: `FAIL no Reconciled marker written`, exit 1.

- [ ] **Step 3: Write `history.sh`**

```sh
#!/bin/sh
# Build the fixture's git history. Usage: sh history.sh <dir> <inject-markers:0|1>
set -eu
DIR=$1
MARKERS=${2:-0}
cd "$DIR"

git init -q
git config user.email eval@example.invalid
git config user.name "Eval Fixture"
git config commit.gpgsign false

c() { git add -A && git commit -q -m "$1"; }

# Every commit must change something: `git commit` exits non-zero on an empty tree
# and `set -eu` would abort the script. Do not add a commit without a change.

# 1-4: the project as it stood when the transaction spec was last reconciled
git add -A && git commit -q -m "chore: scaffold Next.js app"
printf '\n// money helpers\n' >> lib/money.ts
c "feat: add db schema and money helpers"
printf '\n// domain glue\n' >> domain/transaction/index.ts
c "feat: add transaction domain"
printf '\n<!-- consolidated at increment 2 -->\n' >> docs/specs/domains/transaction.md
c "docs: consolidate increment 2 — transaction spec"

RECONCILED=$(git rev-parse HEAD)

# 5-8: work that lands AFTER the spec was reconciled. This is the drift.
printf '\nexport const RECURRING_MAX = 60\n' >> domain/transaction/rules.ts
c "feat: recurring transactions — rules"
printf '\n// recurring series are expanded at read time\n' >> domain/transaction/index.ts
c "feat: recurring transactions — expansion"
printf '\n// TODO: rounding is unspecified\n' >> lib/money.ts
c "chore: note rounding gap in money helpers"
printf '\n<!-- increment 3 closed -->\n' >> docs/roadmap.md
c "docs: close increment 3"

# Arm-owned artifacts for bundle B: reconcile markers, Governs: lines, and the inbound
# citation of decision 0009. All four are written here because three of them need $RECONCILED
# or must land after the drift commits; a fixture carrying only some of them is incoherent —
# arm B's reading order would send the model looking for a Governs: line that does not exist.
if [ "$MARKERS" = "1" ]; then
  SPEC=docs/specs/domains/transaction.md
  TMP=$(mktemp)
  {
    head -1 "$SPEC"
    echo ""
    echo "Source: domain/transaction/**, lib/money.ts"
    echo "Reconciled: 2026-05-12-recurring-transactions ($RECONCILED)"
    tail -n +2 "$SPEC"
  } > "$TMP"
  mv "$TMP" "$SPEC"

  printf '\nThe importKey uniqueness invariant is settled — see decision 0009.\n' >> "$SPEC"

  for D in docs/decisions/0004-money-integer-cents.md docs/decisions/0009-import-key.md; do
    TMP=$(mktemp)
    case "$D" in
      *0004*) G="Governs: money storage and arithmetic; ARCHITECTURE.md conventions; lib/money.ts" ;;
      *0009*) G="Governs: transaction import identity; docs/specs/domains/transaction.md" ;;
    esac
    { head -1 "$D"; echo ""; echo "$G"; tail -n +2 "$D"; } > "$TMP"
    mv "$TMP" "$D"
  done

  git add -A && git commit -q -m "docs: add reconcile markers, Governs lines, and decision citations"
fi

git log --oneline | head -20
```

Note the ordering: markers are committed **last**, so the drift range `$RECONCILED..HEAD` still contains commits 5–8 that touch `domain/transaction`. Writing markers before those commits would produce zero drift and silently disarm `b03`.

- [ ] **Step 4: Run the assertion both ways**

```bash
rm -rf /tmp/fx0 /tmp/fx1
cp -R evals/operating-model/fixture/ledger /tmp/fx0 && sh evals/operating-model/fixture/history.sh /tmp/fx0 0 >/dev/null
node evals/operating-model/fixture/assert-history.mjs /tmp/fx0 0
cp -R evals/operating-model/fixture/ledger /tmp/fx1 && sh evals/operating-model/fixture/history.sh /tmp/fx1 1 >/dev/null
node evals/operating-model/fixture/assert-history.mjs /tmp/fx1 1
```

Expected: `OK no markers, 8 commits` then `OK marker <sha>, drift commits:` listing exactly **two** — the `rules.ts` and `index.ts` commits. Verified by running the script: nine commits with markers, eight without, and `git log <sha>..HEAD -- domain/transaction` returns two. The third post-reconcile commit touches `lib/money.ts`, which is in the spec's `Source:` line but not in this assertion's path filter; a full drift check over both source paths finds three.

- [ ] **Step 5: Commit**

```bash
git add evals/operating-model/fixture
git commit -m "feat: add shaped git history for eval fixture"
```

---

### Task 3: Arm patches and the `CLAUDE.md` instantiation

**Files:**
- Create: `evals/operating-model/arms/01-write-paths.patch`
- Create: `evals/operating-model/arms/02-read-path.patch`
- Create: `evals/operating-model/arms/03-adjudication.patch`
- Create: `evals/operating-model/arms/base-claude-md.md`
- Create: `evals/operating-model/arms/all.checklist`
- Create: `evals/operating-model/arms/assert-arms.mjs`

**Interfaces:**
- Consumes: `harness/operating-model.md` at the baseline sha; `arms/base-claude-md.md`.
- Produces: for each arm name in `baseline|A|B|C|ALL`, a set of files that `stage.mjs` writes into the staged fixture — `docs/operating-model.md` and `CLAUDE.md` at minimum.

Each patch touches **two regions**: the operating-model document body, and the `CLAUDE.md` instantiation. Both live in the same patch file so one review covers everything an arm changes. `base-claude-md.md` is the baseline concrete `CLAUDE.md` — the skeleton from `harness/operating-model.md` lines 60–89 with `<Project>` → `Ledger` and `<axis>` → `domains`.

The nine edits and where each lands:

| Edit | Bundle | Document hunk | `CLAUDE.md` hunk |
|---|---|---|---|
| 1 | A | bootstrap step 2: day-one status line | map's `vision.md` line gains stack-intent |
| 2 | A | step 4 and the sub-increment section name `ARCHITECTURE.md` | Workflow and Hygiene bullets name it |
| 11 | A | decision-status hygiene at the `decisions/` role | Hygiene gains "a decision is never a source for current state" |
| 12 | A | `placeholder` → `near-empty file`; move-not-copy; roadmap in-progress at step 2 | — |
| 3 | B | `docs/specs/` role gains the reconcile-marker paragraph | — (markers are fixture content, see Task 2) |
| 4 | B | — | new `## Reading order` section including the decisions-index rule |
| 5a | B | — | Hygiene bullet 1 collapses; duplicated routing table removed |
| 8 | C | L50 gains the asymmetry and the directional default | — |
| 9 | C | L38 gains descriptions-vs-conventions | — |

- [ ] **Step 1: Record the baseline sha**

```bash
F=evals/operating-model/arms/BASELINE_SHA
[ -s "$F" ] && { echo "REFUSING to overwrite existing baseline: $(cat "$F")"; } || git rev-parse HEAD > "$F"
cat "$F"
```

Expected: a 40-character sha. This pins the baseline permanently; the measurement no longer depends on when the edits land. **The guard matters:** re-running this step after the nine edits have landed would silently move the baseline to a commit that already contains them, and every arm would then be measured against itself. If the file exists, it is correct by definition — never regenerate it.

- [ ] **Step 2: Write the failing arm assertion**

Create `evals/operating-model/arms/assert-arms.mjs`:

```javascript
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const ARMS = { baseline: [], A: ['01'], B: ['02'], C: ['03'], ALL: ['01', '02', '03'] }
const sha = readFileSync('evals/operating-model/arms/BASELINE_SHA', 'utf8').trim()
const base = execFileSync('git', ['show', `${sha}:harness/operating-model.md`], { encoding: 'utf8' })
const baseClaude = readFileSync('evals/operating-model/arms/base-claude-md.md', 'utf8')

// Markers proving each edit is present, checked against the ALL arm.
const CHECKLIST = readFileSync('evals/operating-model/arms/all.checklist', 'utf8')
  .split('\n').filter(l => l.includes('\t')).map(l => { const [id, ...re] = l.split('\t'); return [id, new RegExp(re.join('\t'), 'm')] })

// The `m` flag is load-bearing: row 5a is `^`-anchored and would never match mid-file without it.
// The count assertion guards against a copy that lost its literal tabs, which would silently
// produce an empty checklist and a vacuous pass.
if (CHECKLIST.length !== 10) { console.error(`FAIL checklist has ${CHECKLIST.length} rows, expected 10 — tabs mangled?`); process.exit(1) }

let failed = 0
for (const [arm, patches] of Object.entries(ARMS)) {
  const dir = mkdtempSync(join(tmpdir(), 'arm-'))
  writeFileSync(join(dir, 'operating-model.md'), base)
  writeFileSync(join(dir, 'CLAUDE.md'), baseClaude)
  for (const p of patches) {
    const file = execFileSync('ls', ['evals/operating-model/arms'], { encoding: 'utf8' })
      .split('\n').find(f => f.startsWith(p))
    try {
      execFileSync('git', ['apply', '--verbose', join(process.cwd(), 'evals/operating-model/arms', file)], { cwd: dir })
    } catch (e) { failed++; console.error(`FAIL ${arm}: patch ${file} did not apply\n${e.stderr}`); }
  }
  if (arm === 'ALL') {
    const all = readFileSync(join(dir, 'operating-model.md'), 'utf8') + '\n' + readFileSync(join(dir, 'CLAUDE.md'), 'utf8')
    for (const [id, re] of CHECKLIST) {
      if (!re.test(all)) { failed++; console.error(`FAIL ALL: edit ${id} not present (/${re.source}/)`) }
    }
  }
  console.log(`${arm}: applied ${patches.length} patch(es)`)
}
console.log(failed === 0 ? 'OK all arms materialize' : `${failed} failures`)
process.exit(failed === 0 ? 0 : 1)
```

- [ ] **Step 3: Run it to confirm it fails**

Run: `node evals/operating-model/arms/assert-arms.mjs`
Expected: failure — `base-claude-md.md`, the patches, and `all.checklist` do not exist yet.

- [ ] **Step 4: Write `base-claude-md.md` and `all.checklist`**

`base-claude-md.md`: copy `harness/operating-model.md` lines 61–89 verbatim (the fenced skeleton's contents, without the fence), substituting `Ledger` for `<Project>` and `domains` for `<axis>`.

`all.checklist`, one tab-separated `id<TAB>regex` per line:

```text
1	Status: nothing built yet
1b	intended stack and layout
2	architectural convention.*ARCHITECTURE\.md
11	never a source for current state
12	near-empty file
3	Reconciled: <increment-slug>
4	## Reading order
5a	^- Keep this file a thin map: every fact category has a home in the map above
8	When unsure, leave it in the spec
9	Conventions.*are facts about what is \*\*in force\*\*
```

- [ ] **Step 5: Write the three patches**

Produce each by editing a scratch copy and capturing the diff, so the hunks are real rather than hand-written:

```bash
sha=$(cat evals/operating-model/arms/BASELINE_SHA)
rm -rf /tmp/armwork && mkdir /tmp/armwork && cd /tmp/armwork && git init -q
git show "$sha:harness/operating-model.md" > operating-model.md
cp "$OLDPWD/evals/operating-model/arms/base-claude-md.md" CLAUDE.md
git add -A && git commit -q -m base
# edit operating-model.md and CLAUDE.md for bundle A only, then:
git diff > "$OLDPWD/evals/operating-model/arms/01-write-paths.patch"
git checkout . # reset, then repeat for 02 and 03
```

Exact replacement wording for all nine edits is in `evals/operating-model/reference/review-practitioner.md` §4 (*Proposed edits*, items 1–13) and `reference/review-advocate.md` §4 (*Proposed edits*, E0–E15), vendored by Task 1 Step 1. Where the two differ, use the practitioner's wording — it held the deciding vote. Map from this plan's edit numbers to the practitioner's items: 1→1, 2→2, 3→3, 4→4, 5→9+12, 8→7, 9→10, 11→11, 12→13.

Apply order is fixed **A → B → C**. Bundle A adds lines to the skeleton's Workflow and Hygiene regions; bundle B rewrites Hygiene bullet 1 and deletes the routing table nearby. If B's hunk swallows an A line, the checklist in Step 2 catches it — that is what it is for.

- [ ] **Step 6: Run the assertion until green**

Run: `node evals/operating-model/arms/assert-arms.mjs`
Expected: five `applied` lines and `OK all arms materialize`.

- [ ] **Step 7: Hand-check the ALL diff**

```bash
sha=$(cat evals/operating-model/arms/BASELINE_SHA)
rm -rf /tmp/allcheck && mkdir /tmp/allcheck && cd /tmp/allcheck && git init -q
git show "$sha:harness/operating-model.md" > operating-model.md
cp "$OLDPWD/evals/operating-model/arms/base-claude-md.md" CLAUDE.md && git add -A && git commit -q -m base
for p in 01 02 03; do git apply "$OLDPWD"/evals/operating-model/arms/$p-*.patch; done
git diff
```

Read the diff against the nine-edit table above. The automated checklist proves each edit's *marker string* is present; only reading proves the edits did not mangle each other's surroundings.

- [ ] **Step 8: Commit**

```bash
cd "$OLDPWD" && git add evals/operating-model/arms
git commit -m "feat: add arm patches and CLAUDE.md instantiation"
```

---

### Task 4: The 16 cases

**Files:**
- Create: `evals/runner/schema.mjs`
- Create: `evals/runner/validate.mjs`
- Create: `evals/runner/schema.test.mjs`
- Create: `evals/operating-model/cases/routing/r{01..12}-*.md`
- Create: `evals/operating-model/cases/behavioral/b{01..04}-*.md`

**Interfaces:**
- Consumes: nothing at runtime.
- Produces: `parseCase(text) -> {id, family, finding, targets[], predicts, world, reps{}, caps{}, grade{}, prompt}` and `validateCase(caseObj) -> string[]` (empty array means valid), both exported from `schema.mjs`. `run.mjs` and `grade.mjs` consume these.

The design specifies `expect` as a list of globs. Routing answers use `--json-schema` so the answer is a validated object rather than a parsed line:

```json
{"type":"object","properties":{"destination":{"type":"string"}},"required":["destination"],"additionalProperties":false}
```

`forbid` is then checked against `destination` **only**. This supersedes the design's last-non-empty-line rule and removes the hedge problem entirely: a model may reason freely in its thinking, and only the field is graded. Note this in `DESIGN.md` when the plan lands.

- [ ] **Step 1: Write the failing schema test**

Create `evals/runner/schema.test.mjs`:

```javascript
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseCase, validateCase } from './schema.mjs'

const GOOD = `---
id: r01-money-rounding-home
family: routing
finding: F2/S3
targets: [A]
predicts: fail-on-baseline
world: month-3
reps: {haiku: 10, opus: 5}
caps: {budgetUsd: 0.5, timeoutMs: 120000}
grade:
  type: destination
  expect: ["ARCHITECTURE.md"]
  forbid: ["docs/specs/**"]
---
Where does this fact belong?
`

test('parses frontmatter and prompt', () => {
  const c = parseCase(GOOD)
  assert.equal(c.id, 'r01-money-rounding-home')
  assert.deepEqual(c.targets, ['A'])
  assert.equal(c.reps.haiku, 10)
  assert.equal(c.grade.type, 'destination')
  assert.match(c.prompt, /Where does this fact belong/)
})

test('valid case yields no errors', () => {
  assert.deepEqual(validateCase(parseCase(GOOD)), [])
})

test('rejects an unknown predicts value', () => {
  const bad = parseCase(GOOD.replace('fail-on-baseline', 'partial-fail'))
  assert.ok(validateCase(bad).some(e => /predicts/.test(e)))
})

test('rejects a tool-log case without a predicate', () => {
  const bad = parseCase(GOOD.replace('type: destination', 'type: tool-log'))
  assert.ok(validateCase(bad).some(e => /predicate/.test(e)))
})

test('rejects an arm name that is not a bundle', () => {
  const bad = parseCase(GOOD.replace('targets: [A]', 'targets: [D]'))
  assert.ok(validateCase(bad).some(e => /targets/.test(e)))
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test evals/runner/schema.test.mjs`
Expected: FAIL — `Cannot find module './schema.mjs'`.

- [ ] **Step 3: Implement `schema.mjs`**

The frontmatter subset used here is flat keys, inline arrays, inline objects, and one nested block (`grade`). Write a small parser rather than adding a YAML dependency — no npm deps is a global constraint.

```javascript
const ARMS = ['A', 'B', 'C']
const FAMILIES = ['routing', 'behavioral']
const PREDICTS = ['fail-on-baseline', 'control']
const WORLDS = ['month-3', 'day-1']
const GRADE_TYPES = ['destination', 'tool-log']

const scalar = v => {
  v = v.trim()
  if (v.startsWith('[') && v.endsWith(']')) return v.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean)
  if (v.startsWith('{') && v.endsWith('}')) return Object.fromEntries(v.slice(1, -1).split(',').filter(Boolean).map(p => {
    const i = p.indexOf(':'); return [p.slice(0, i).trim(), scalar(p.slice(i + 1))]
  }))
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v)
  return v.replace(/^["']|["']$/g, '')
}

export function parseCase(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!m) throw new Error('case has no frontmatter block')
  const out = { prompt: m[2].trim() }
  let nested = null
  for (const line of m[1].split('\n')) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue
    const indented = /^\s\s+\S/.test(line)
    const i = line.indexOf(':')
    if (i < 0) continue
    const key = line.slice(0, i).trim()
    const val = line.slice(i + 1)
    if (indented && nested) { out[nested][key] = scalar(val); continue }
    if (val.trim() === '') { nested = key; out[key] = {}; continue }
    nested = null
    out[key] = scalar(val)
  }
  return out
}

export function validateCase(c) {
  const e = []
  if (!c.id) e.push('id is required')
  if (!FAMILIES.includes(c.family)) e.push(`family must be one of ${FAMILIES}`)
  if (!PREDICTS.includes(c.predicts)) e.push(`predicts must be one of ${PREDICTS}`)
  if (!WORLDS.includes(c.world)) e.push(`world must be one of ${WORLDS}`)
  if (!c.finding) e.push('finding is required — every case cites its provenance')
  const t = c.targets ?? []
  if (!Array.isArray(t) || t.some(x => !ARMS.includes(x))) e.push(`targets must be a subset of ${ARMS}`)
  if (!c.reps || Object.keys(c.reps).length === 0) e.push('reps must name at least one model')
  if (!c.caps?.timeoutMs || !c.caps?.budgetUsd) e.push('caps.timeoutMs and caps.budgetUsd are required')
  const g = c.grade ?? {}
  if (!GRADE_TYPES.includes(g.type)) e.push(`grade.type must be one of ${GRADE_TYPES}`)
  if (g.type === 'destination' && (!Array.isArray(g.expect) || g.expect.length === 0)) e.push('destination grade needs a non-empty expect list')
  if (g.type === 'tool-log' && !g.predicate) e.push('tool-log grade needs a predicate')
  if (c.family === 'behavioral' && g.type !== 'tool-log') e.push('behavioral cases grade by tool-log')
  // Parse the predicate at validation time, so a malformed one is caught in Phase 1
  // rather than throwing hours into a full run.
  if (g.type === 'tool-log' && g.predicate) {
    for (const t of String(g.predicate).split(/\s+before\s+/))
      if (!/^saw\([A-Za-z*|]+:.+\)$/.test(t.trim())) e.push(`malformed predicate term: ${t.trim()}`)
  }
  return e
}

export function armsFor(c) {
  return ['baseline', ...(c.targets ?? []), 'ALL']
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test evals/runner/schema.test.mjs`
Expected: 5 passing tests.

- [ ] **Step 5: Write `validate.mjs`**

```javascript
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseCase, validateCase, armsFor } from './schema.mjs'

const suite = process.argv[2]
if (!suite) { console.error('usage: node validate.mjs <suite-dir>'); process.exit(2) }

let bad = 0, combos = 0
const seen = new Set()
for (const fam of ['routing', 'behavioral']) {
  const dir = join(suite, 'cases', fam)
  for (const f of readdirSync(dir).filter(f => f.endsWith('.md')).sort()) {
    const c = parseCase(readFileSync(join(dir, f), 'utf8'))
    const errs = validateCase(c)
    if (c.family !== fam) errs.push(`family ${c.family} does not match directory ${fam}`)
    if (seen.has(c.id)) errs.push(`duplicate id ${c.id}`)
    seen.add(c.id)
    combos += armsFor(c).length
    if (errs.length) { bad++; console.error(`FAIL ${f}\n  ${errs.join('\n  ')}`) }
  }
}
console.log(`${seen.size} cases, ${combos} case-arm combinations, ${bad} invalid`)
process.exit(bad === 0 ? 0 : 1)
```

- [ ] **Step 6: Write the 16 case files**

Each routing case body states the fact in a way that does **not** name its own category — a prompt saying "here is an architectural convention" hands over the answer and makes the case measure nothing. State the fact in domain terms and let the model classify it. Example, `cases/routing/r01-money-rounding-home.md`:

```markdown
---
id: r01-money-rounding-home
family: routing
finding: F2/S3
targets: [A]
predicts: fail-on-baseline
world: month-3
reps: {haiku: 10, opus: 5}
caps: {budgetUsd: 0.5, timeoutMs: 120000}
grade:
  type: destination
  expect: ["ARCHITECTURE.md"]
  forbid: ["docs/specs/**", "docs/guidelines/**", "docs/decisions/**"]
---
A one-line change to `lib/money.ts` just settled how the app rounds: amounts round half-up when they are formatted for display, and stored values are never rounded. This is now true everywhere in the codebase, not just in one feature.

Following this project's documentation model, name the single file where this fact belongs.
```

Take the fact statements for the other eleven from `DESIGN.md`'s routing table, and give each one two or three explicit must-state / must-not-state constraints before writing it — this is the weakest specification in the plan and the likeliest source of a fixture that passes every assertion while measuring nothing. Worked examples of the constraint form: `r07` must name which unit *enforces* the invariant and must not use the word "contract"; `r12` must describe the existing spec's axis without naming its path; `r04` must state that several units share the behavior (the guideline temptation) without using the words "guideline" or "spec"; `r06` must describe both shapes and the directive for new code without using the words "convention" or "intended". Behavioral cases carry `caps: {budgetUsd: 3.0, timeoutMs: 900000}` and a `grade.predicate`, for example `b01`:

```yaml
grade:
  type: tool-log
  predicate: "saw(*:docs/decisions/0004-*) before saw(Write|Edit:**)"
```

Two rules for writing predicate terms, both learned the hard way:

- **Read-side terms use `*` for the tool**, not `Read`. The stream parser projects paths out of `Bash` commands precisely so `cat docs/decisions/0004-*.md` counts as reading the decision; pinning the term to `Read:` throws that away and under-credits the arm.
- **Write-side terms use `Write|Edit`.** An agent modifying an existing file uses `Edit`, so a `Write`-only term false-fails every real consolidation.

The four predicates in full:

| case | predicate |
|---|---|
| b01 | `saw(*:docs/decisions/0004-*) before saw(Write\|Edit:**)` |
| b02 | `saw(*:docs/guidelines/nextjs-runtime.md) before saw(Write\|Edit:**/design.md)` |
| b03 | `saw(Bash:*git*log*domain/transaction*)` |
| b04 | `saw(Write\|Edit:ARCHITECTURE.md)` |

`b03`'s glob matches the Bash **command string**, not just a projected path — otherwise `ls domain/transaction` or `cat domain/transaction/rules.ts` would count as a drift check, which would over-credit arm B and invert the design's stated conservatism. It stays deliberately narrow: drift noticed some other way scores as a miss.

- [ ] **Step 7: Validate all cases**

Run: `node evals/runner/validate.mjs evals/operating-model`
Expected: `16 cases, 46 case-arm combinations, 0 invalid`. If the combination count is not 46, the `targets` fields disagree with `DESIGN.md`'s run-size section — fix whichever is wrong and say which.

- [ ] **Step 8: Commit**

```bash
git add evals/runner evals/operating-model/cases
git commit -m "feat: add case schema, validator, and the 16 eval cases"
```

---

## ⛔ Phase 1 review gate

Everything above is checkable without spending a token: `assert-fixture.mjs`, `assert-history.mjs`, `assert-arms.mjs`, `validate.mjs`, and one hand-read of the `ALL` diff. **Stop here and get review before Phase 2.**

The review must include **reading all twelve routing prompts aloud against their `expect` values.** The validator checks a case's *shape*; nothing before calibration checks its *wording*, and a prompt that names its own category ("here is an architectural convention…") hands over the answer and makes the case measure nothing. A poisoned expectation cannot be fixed by more reps and corrupts both arms equally, so this is the only place it gets caught cheaply.

Run all four:

```bash
node evals/operating-model/fixture/assert-fixture.mjs
rm -rf /tmp/fx1 && cp -R evals/operating-model/fixture/ledger /tmp/fx1 && sh evals/operating-model/fixture/history.sh /tmp/fx1 1 >/dev/null && node evals/operating-model/fixture/assert-history.mjs /tmp/fx1 1
node evals/operating-model/arms/assert-arms.mjs
node evals/runner/validate.mjs evals/operating-model
```

---

# Phase 2 — verifiable only by running

---

### Task 5: Staging and the materialization self-check

**Files:**
- Create: `evals/runner/stage.mjs`
- Create: `evals/runner/stage.test.mjs`

**Interfaces:**
- Consumes: `armsFor` from `schema.mjs`.
- Produces: `stage({suite, arm, world, baselineSha}) -> {dir, cleanup()}`, and `selfCheck(dir, arm) -> string[]` (empty means clean). `run.mjs` calls `stage` then `selfCheck` before every invocation.

- [ ] **Step 1: Write the failing staging test**

Create `evals/runner/stage.test.mjs`:

```javascript
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { stage, selfCheck } from './stage.mjs'

const suite = 'evals/operating-model'
const sha = readFileSync(join(suite, 'arms/BASELINE_SHA'), 'utf8').trim()

test('baseline stage has the vendored model and no reconcile markers', () => {
  const { dir, cleanup } = stage({ suite, arm: 'baseline', world: 'month-3', baselineSha: sha })
  assert.ok(existsSync(join(dir, 'docs/operating-model.md')), 'model is vendored in every arm')
  assert.ok(existsSync(join(dir, 'CLAUDE.md')))
  const spec = readFileSync(join(dir, 'docs/specs/domains/transaction.md'), 'utf8')
  assert.doesNotMatch(spec, /^Reconciled:/m)
  assert.deepEqual(selfCheck(dir, 'baseline'), [])
  cleanup()
})

test('arm B stage has reconcile markers and the reading order', () => {
  const { dir, cleanup } = stage({ suite, arm: 'B', world: 'month-3', baselineSha: sha })
  assert.match(readFileSync(join(dir, 'docs/specs/domains/transaction.md'), 'utf8'), /^Reconciled:/m)
  assert.match(readFileSync(join(dir, 'CLAUDE.md'), 'utf8'), /## Reading order/)
  assert.deepEqual(selfCheck(dir, 'B'), [])
  cleanup()
})

test('selfCheck catches a marker leaking into the baseline', () => {
  const { dir, cleanup } = stage({ suite, arm: 'B', world: 'month-3', baselineSha: sha })
  assert.ok(selfCheck(dir, 'baseline').length > 0, 'a B tree checked as baseline must fail')
  cleanup()
})

test('day-1 world contains only whitelisted files', () => {
  const { dir, cleanup } = stage({ suite, arm: 'A', world: 'day-1', baselineSha: sha })
  assert.ok(!existsSync(join(dir, 'docs/specs')), 'day-1 has no specs')
  assert.ok(existsSync(join(dir, 'docs/vision.md')))
  cleanup()
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test evals/runner/stage.test.mjs`
Expected: FAIL — `Cannot find module './stage.mjs'`.

- [ ] **Step 3: Implement `stage.mjs`**

```javascript
import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync, existsSync, readdirSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'

const PATCHES = { baseline: [], A: ['01'], B: ['02'], C: ['03'], ALL: ['01', '02', '03'] }
const MARKER_ARMS = new Set(['B', 'ALL'])      // Source:/Reconciled: on specs, Governs: on decisions, inbound links
const STATUS_LINE_ARMS = new Set(['A', 'ALL']) // the day-1 ARCHITECTURE.md status line (edit 1)

export function stage({ suite, arm, world, baselineSha }) {
  const dir = mkdtempSync(join(tmpdir(), `eval-${arm}-`))
  cpSync(join(suite, 'fixture/ledger'), dir, { recursive: true })

  if (world === 'day-1') {
    const keep = new Set(readFileSync(join(suite, 'fixture/day-1.whitelist'), 'utf8').split('\n').map(s => s.trim()).filter(Boolean))
    const walk = d => readdirSync(join(dir, d), { withFileTypes: true }).flatMap(e => {
      const rel = d ? `${d}/${e.name}` : e.name
      return e.isDirectory() ? walk(rel) : [rel]
    })
    for (const rel of walk('')) if (!keep.has(rel)) rmSync(join(dir, rel))
    // Deleting files leaves empty directories behind, so prune bottom-up.
    const prune = d => {
      for (const e of readdirSync(join(dir, d), { withFileTypes: true }))
        if (e.isDirectory()) prune(d ? `${d}/${e.name}` : e.name)
      if (d && readdirSync(join(dir, d)).length === 0) rmSync(join(dir, d), { recursive: true })
    }
    prune('')
    // Edit 1's payload IS this line, so it is arm-owned: without it, r05 in arm A
    // measures nothing and the day-1 world is identical across arms.
    writeFileSync(join(dir, 'ARCHITECTURE.md'), STATUS_LINE_ARMS.has(arm)
      ? '# Architecture\n\nStatus: nothing built yet; the intended stack and layout live in docs/vision.md\n'
      : '# Architecture\n')
  }

  // The vendored model and the concrete CLAUDE.md are arm-owned. Patch them in a scratch
  // tree first so `git apply` sees the exact paths the patches were generated against.
  const work = mkdtempSync(join(tmpdir(), 'armwork-'))
  writeFileSync(join(work, 'operating-model.md'),
    execFileSync('git', ['show', `${baselineSha}:harness/operating-model.md`], { encoding: 'utf8' }))
  cpSync(join(suite, 'arms/base-claude-md.md'), join(work, 'CLAUDE.md'))
  const armDir = join(process.cwd(), suite, 'arms')
  for (const p of PATCHES[arm]) {
    const file = readdirSync(armDir).find(f => f.startsWith(p) && f.endsWith('.patch'))
    execFileSync('git', ['apply', join(armDir, file)], { cwd: work })
  }
  mkdirSync(dirname(join(dir, 'docs/operating-model.md')), { recursive: true })
  cpSync(join(work, 'operating-model.md'), join(dir, 'docs/operating-model.md'))
  cpSync(join(work, 'CLAUDE.md'), join(dir, 'CLAUDE.md'))
  rmSync(work, { recursive: true, force: true })

  execFileSync('sh', [join(process.cwd(), suite, 'fixture/history.sh'), dir, MARKER_ARMS.has(arm) ? '1' : '0'],
    { stdio: 'ignore' })

  return { dir, cleanup: () => rmSync(dir, { recursive: true, force: true }) }
}

// Checks every arm-owned artifact class in DESIGN.md's table, not just the first one.
// A class that is claimed but never written would otherwise read as "absent everywhere",
// i.e. a vacuous pass — which is exactly how the missing Governs: lines went unnoticed.
const ARTIFACTS = [
  ['docs/specs/domains/transaction.md', /^Reconciled:/m, 'reconcile markers', MARKER_ARMS],
  ['docs/decisions/0004-money-integer-cents.md', /^Governs:/m, 'Governs: line on 0004', MARKER_ARMS],
  ['docs/decisions/0009-import-key.md', /^Governs:/m, 'Governs: line on 0009', MARKER_ARMS],
  ['docs/specs/domains/transaction.md', /see decision 0009/, 'inbound link to 0009', MARKER_ARMS],
]

// Note what is NOT arm-owned: ARCHITECTURE.md's `see decision 0004` pointer exists in every
// arm, because a convention citing its decision is the fixture's realistic month-3 state and
// the operating model's own worked example. Decision 0009 is the uncited one — that absence is
// the amnesia condition edit 4's inbound-link invariant repairs, so its citation is arm-owned.

export function selfCheck(dir, arm) {
  const errs = []
  for (const [rel, re, label, arms] of ARTIFACTS) {
    const abs = join(dir, rel)
    if (!existsSync(abs)) continue            // the day-1 world legitimately lacks most of these
    const has = re.test(readFileSync(abs, 'utf8'))
    const wants = arms.has(arm)
    if (has && !wants) errs.push(`arm ${arm} must not carry ${label} (${rel})`)
    if (!has && wants) errs.push(`arm ${arm} must carry ${label} (${rel})`)
  }
  if (!existsSync(join(dir, 'docs/operating-model.md'))) errs.push('vendored operating model missing')
  if (!existsSync(join(dir, 'CLAUDE.md'))) errs.push('CLAUDE.md missing')
  return errs
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test evals/runner/stage.test.mjs`
Expected: 4 passing tests.

- [ ] **Step 5: Commit**

```bash
git add evals/runner
git commit -m "feat: add fixture staging and arm materialization self-check"
```

---

### Task 6: Invocation, isolation, and the auth sanity guard

**Files:**
- Create: `evals/runner/invoke.mjs`
- Create: `evals/runner/invoke.test.mjs`

**Interfaces:**
- Consumes: `stage`'s `dir`.
- Produces: `buildArgs({model, family, caps, jsonSchema, isolated}) -> string[]`, `composeRoutingPrompt(dir, question) -> string`, `parseStream(text) -> {events[], toolCalls[], answerText, model, result, hookEvents}`, `isBroken(parsed) -> string|null`, and `invoke({dir, prompt, ...}) -> parsed`.

**Routing context assembly.** A routing case runs in one turn with tools disabled, so nothing it needs can be fetched — the runner must put it in the prompt. `DESIGN.md`'s *Delivery* section fixes the five parts, and getting this wrong is silently fatal: with only the auto-discovered `CLAUDE.md` in context, bundle C is entirely invisible (it is all document body) and bundle A loses its body halves, so both would read as ineffective. The five parts, in order: the fixture's concrete `CLAUDE.md`, the vendored `docs/operating-model.md`, an `ls -R` tree, both domain specs, then the question. Items 3 and 4 are what make `r07` and `r12` answerable and `r04`'s contagion bait live.

**Isolation.** Host hooks fire inside nested runs — verified, 6 hook events. The superpowers SessionStart hook and the skills-gate `UserPromptSubmit` hook inject instructions into every run, and the skills gate in particular tells the model to go looking for skills, which perturbs exactly the read behavior `b01`–`b03` measure. Two configurations, and the runner must record which one it used:

1. **Isolated (preferred).** Export `ANTHROPIC_API_KEY`, pass `--setting-sources project`. No host hooks, no user `CLAUDE.md`, no plugins. Verified to suppress hooks.
2. **Fallback, subscription auth only.** Omit `--setting-sources`; host hooks fire. This is *arm-invariant* contamination — identical in every arm — so it inflates variance without biasing the delta. Its specific risk: the skills gate may push the model to read more, partially substituting for the reading-order edit and **masking bundle B**. Record it in the results and in `README.md`.

`run.mjs` refuses to start in mode 2 unless `--allow-contaminated` is passed, so nobody gets mode 2 by accident.

- [ ] **Step 1: Write the failing invocation test**

These tests are pure functions over a recorded stream — no model calls, so they run anywhere.

```javascript
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildArgs, parseStream, isBroken } from './invoke.mjs'

const SCHEMA = '{"type":"object","properties":{"destination":{"type":"string"}},"required":["destination"]}'

test('routing args carry verbose, json schema, and a budget cap', () => {
  const a = buildArgs({ model: 'haiku', family: 'routing', caps: { budgetUsd: 0.5 }, jsonSchema: SCHEMA, isolated: true })
  assert.ok(a.includes('--verbose'), 'stream-json requires --verbose')
  assert.ok(a.includes('--output-format') && a.includes('stream-json'))
  assert.ok(a.includes('--json-schema'))
  assert.ok(a.includes('--max-budget-usd'))
  assert.deepEqual(a.filter(x => x === '--setting-sources').length, 1)
})

test('behavioral args allow tools and omit the json schema', () => {
  const a = buildArgs({ model: 'opus', family: 'behavioral', caps: { budgetUsd: 3 }, isolated: true })
  assert.ok(!a.includes('--json-schema'))
  assert.ok(a.includes('--permission-mode'))
})

test('parseStream projects tool calls per tool, including Bash paths', () => {
  const stream = [
    '{"type":"system","subtype":"init","model":"claude-haiku-4-5-20251001"}',
    '{"type":"assistant","message":{"content":[{"type":"tool_use","name":"Read","input":{"file_path":"/tmp/x/docs/decisions/0004-money-integer-cents.md"}}]}}',
    '{"type":"assistant","message":{"content":[{"type":"tool_use","name":"Bash","input":{"command":"git log abc..HEAD -- domain/transaction"}}]}}',
    '{"type":"assistant","message":{"content":[{"type":"text","text":"{\\"destination\\":\\"ARCHITECTURE.md\\"}"}]}}',
    '{"type":"result","subtype":"success","num_turns":3,"total_cost_usd":0.02}',
  ].join('\n')
  const p = parseStream(stream)
  assert.equal(p.toolCalls.length, 2)
  assert.equal(p.toolCalls[0].name, 'Read')
  assert.ok(p.toolCalls[0].paths.some(x => x.includes('0004-money-integer-cents')))
  assert.equal(p.toolCalls[1].name, 'Bash')
  assert.ok(p.toolCalls[1].paths.includes('domain/transaction'), 'Bash paths come out of the command string')
  assert.equal(p.result.num_turns, 3)
  assert.equal(p.model, 'claude-haiku-4-5-20251001')
})

test('isBroken flags an auth failure that reports success', () => {
  const stream = [
    '{"type":"system","subtype":"init"}',
    '{"type":"assistant","message":{"content":[{"type":"text","text":"Not logged in · Please run /login"}]}}',
    '{"type":"result","subtype":"success","num_turns":1,"total_cost_usd":0}',
  ].join('\n')
  assert.match(isBroken(parseStream(stream)), /auth/i)
})

test('isBroken passes a real run', () => {
  const stream = [
    '{"type":"system","subtype":"init"}',
    '{"type":"assistant","message":{"content":[{"type":"text","text":"{\\"destination\\":\\"ARCHITECTURE.md\\"}"}]}}',
    '{"type":"result","subtype":"success","num_turns":2,"total_cost_usd":0.01}',
  ].join('\n')
  assert.equal(isBroken(parseStream(stream)), null)
})

test('routing prompt carries all five delivery parts', () => {
  const sha = readFileSync('evals/operating-model/arms/BASELINE_SHA', 'utf8').trim()
  const { dir, cleanup } = stage({ suite: 'evals/operating-model', arm: 'C', world: 'month-3', baselineSha: sha })
  const p = composeRoutingPrompt(dir, 'Where does this fact belong?')
  assert.match(p, /# Ledger/, 'the concrete CLAUDE.md is included')
  assert.match(p, /Operating Model: Repository as System of Record/, 'the vendored document body is included — bundle C lives only here')
  assert.match(p, /docs\/specs\/domains\/budget\.md/, 'the file tree is included')
  assert.match(p, /zero/i, 'budget.md content is included, so the contagion bait is live')
  assert.ok(p.lastIndexOf('Where does this fact belong?') > p.indexOf('Operating Model'), 'the question comes last')
  cleanup()
})
```

Add `import { readFileSync } from 'node:fs'`, `import { stage } from './stage.mjs'`, and `composeRoutingPrompt` to this file's imports.

- [ ] **Step 2: Run to verify it fails**

Run: `node --test evals/runner/invoke.test.mjs`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `invoke.mjs`**

```javascript
import { execFile, execFileSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const PATH_RE = /(?:[\w.@-]+\/)+[\w.@*-]+|\b[\w-]+\.(?:md|ts|tsx|json|sh|mjs)\b/g

// DESIGN.md § Delivery: the five parts, in order, identical across arms except arm-owned content.
const ROUTING_CONTEXT = [
  'CLAUDE.md',
  'docs/operating-model.md',
  'docs/specs/domains/transaction.md',
  'docs/specs/domains/budget.md',
]

export function composeRoutingPrompt(dir, question) {
  const parts = []
  for (const rel of ROUTING_CONTEXT) {
    const abs = join(dir, rel)
    if (!existsSync(abs)) continue   // day-1 world legitimately lacks the specs
    parts.push(`===== ${rel} =====\n${readFileSync(abs, 'utf8').trim()}`)
  }
  const tree = execFileSync('git', ['-C', dir, 'ls-files'], { encoding: 'utf8' }).trim()
  parts.push(`===== file tree =====\n${tree}`)
  parts.push(`===== question =====\n${question}`)
  return parts.join('\n\n')
}

export function buildArgs({ model, family, caps, jsonSchema, isolated }) {
  const a = ['-p', '--model', model, '--output-format', 'stream-json', '--verbose']
  if (caps?.budgetUsd) a.push('--max-budget-usd', String(caps.budgetUsd))
  if (isolated) a.push('--setting-sources', 'project')
  if (family === 'routing') {
    a.push('--allowedTools', '')          // one turn, no tools: the context is pre-assembled
    if (jsonSchema) a.push('--json-schema', jsonSchema)
  } else {
    a.push('--permission-mode', 'acceptEdits')
  }
  return a
}

export function parseStream(text) {
  const events = []
  for (const line of text.split('\n')) {
    if (!line.trim()) continue
    try { events.push(JSON.parse(line)) } catch { /* partial or non-JSON line */ }
  }
  const toolCalls = []
  let answerText = '', model = null, result = null, hookEvents = 0
  for (const e of events) {
    if (e.type === 'system') {
      if (String(e.subtype).startsWith('hook')) hookEvents++
      if (e.subtype === 'init' && e.model) model = e.model
    } else if (e.type === 'assistant') {
      for (const c of e.message?.content ?? []) {
        if (c.type === 'tool_use') {
          const src = c.input?.file_path ?? c.input?.path ?? c.input?.command ?? JSON.stringify(c.input ?? {})
          toolCalls.push({ name: c.name, raw: src, paths: [...String(src).matchAll(PATH_RE)].map(m => m[0]) })
        } else if (c.type === 'text') answerText += c.text
      }
    } else if (e.type === 'result') result = e
  }
  return { events, toolCalls, answerText: answerText.trim(), model, result, hookEvents }
}

export function isBroken(p) {
  if (!p.result) return 'no result event — the run did not complete'
  if (/not logged in|please run \/login/i.test(p.answerText)) return 'auth failure: CLI reported "Not logged in"'
  if (p.result.subtype === 'success' && p.result.total_cost_usd === 0 && p.result.num_turns <= 1)
    return 'suspicious: success with zero cost and one turn — treat as auth or config failure'
  if (p.result.subtype && p.result.subtype !== 'success') return `result subtype ${p.result.subtype}`
  return null
}

export function invoke({ dir, prompt, model, family, caps, jsonSchema, isolated }) {
  return new Promise(resolve => {
    const args = [...buildArgs({ model, family, caps, jsonSchema, isolated }), prompt]
    execFile('claude', args, { cwd: dir, timeout: caps.timeoutMs, maxBuffer: 64 * 1024 * 1024 },
      (err, stdout) => {
        const p = parseStream(stdout ?? '')
        // Real Read/Write/Edit calls carry ABSOLUTE file_paths, so every projected path starts
        // with the staging directory. Strip it here, where `dir` is known — otherwise root-level
        // files (ARCHITECTURE.md, CLAUDE.md) never match any glob and b04 is silently zeroed.
        const prefix = dir.replace(/^\//, '') + '/'
        for (const c of p.toolCalls) c.paths = c.paths.map(x => x.startsWith(prefix) ? x.slice(prefix.length) : x)
        p.timedOut = Boolean(err && err.killed)
        p.args = args
        resolve(p)
      })
  })
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test evals/runner/invoke.test.mjs`
Expected: 6 passing tests. The routing-prompt test depends on Task 5's `stage`, so it fails until that is done — run it after Task 5 if you are working out of order.

The `git ls-files` call is why `composeRoutingPrompt` runs *after* `history.sh`: the tree comes from git rather than a directory walk so it lists exactly the tracked fixture, with no temp-dir noise.

- [ ] **Step 5: Verify auth end to end — this cannot be done from inside a Claude Code session**

Nested `claude` invocations from a Claude Code session failed auth in every configuration tried (`ANTHROPIC_API_KEY` unset; keychain apparently unreachable from the sandbox). **Run this from a normal terminal:**

```bash
cd /tmp && claude -p 'Reply with only: ok' --model haiku --output-format stream-json --verbose | tail -2
```

Expected: a `result` event with `subtype: "success"`, `total_cost_usd` greater than zero, and an assistant text of `ok`. If instead the text is `Not logged in`, stop: no measurement is possible until auth works, and `isBroken` will correctly reject every run.

Then decide the isolation mode: with `ANTHROPIC_API_KEY` exported, re-run adding `--setting-sources project` and confirm no `hook_started` events appear. If that fails auth, the suite runs in fallback mode and `--allow-contaminated` is required.

- [ ] **Step 5b: Verify every CLI assertion this plan makes that is NOT in the verified-facts table**

The table at the top records what was actually smoke-tested. Everything below is *used* by the code and *assumed* — the plan's own rule is not to trust memory over verification, and each of these silently breaks a different part of the suite. Check them all in one terminal session before the calibration run:

| Assumption | What breaks if wrong | Check |
|---|---|---|
| A flag exists that truly disables all tools for routing runs (`--allowedTools ''` is a guess; it governs permission pre-approval, and read-only tools may not need approval at all) | routing context is uncontrolled per rep — `grade()` now scores such runs `error`, so this shows up as a wall of errors rather than bad data | run a routing-shaped prompt in a staged dir and confirm zero `tool_use` events; if the flag is wrong, find the real one (`--disallowedTools`, or `--permission-mode` plus an empty allowlist) |
| Structured output from `--json-schema` arrives as assistant **text** | every routing run grades `error` ("no destination in answer") | run with the schema and confirm the JSON object appears in a `content[].type === "text"` block |
| `--setting-sources project` still injects the project `CLAUDE.md` | the entire bundle-B behavioral channel is dead — the reading order would never reach the model | in isolated mode, ask the agent to quote a distinctive line from the fixture's `CLAUDE.md` |
| The `system`/`init` event carries `.model` | `resolvedModel` is null in every ledger line; model drift becomes untraceable | inspect the init event |
| Budget exhaustion surfaces as a non-`success` result subtype | cap-hits score `fail` instead of `error`, reintroducing treatment-correlated censoring | run with `--max-budget-usd 0.001` and inspect `result.subtype` |
| In subscription (fallback) mode, `total_cost_usd` is non-zero | `isBroken`'s zero-cost heuristic blanket-errors every run | run once without `--setting-sources` and inspect `result.total_cost_usd` |

Record the outcomes in `evals/operating-model/README.md` under a *Verified CLI facts* heading, and move any that fail into a fix before proceeding.

- [ ] **Step 6: Commit**

```bash
git add evals/runner
git commit -m "feat: add CLI invocation, stream parsing, and auth sanity guard"
```

---

### Task 7: The grader

**Files:**
- Create: `evals/runner/grade.mjs`
- Create: `evals/runner/grade.test.mjs`

**Interfaces:**
- Consumes: `parseStream`'s output shape from `invoke.mjs`.
- Produces: `grade(parsed, caseObj) -> {verdict: 'pass'|'fail'|'error', reason}` and a `--self-check <suite>` CLI mode that re-grades `results/golden/**` and diffs against the frozen verdicts.

Predicate grammar, exactly two forms — anything else is a case-authoring error:
- `saw(Tool:glob)`
- `saw(Tool:glob) before saw(Tool:glob)`, comparing **first** occurrences.

`b03`'s predicate carries a literal path (`domain/transaction/**`), never one parsed from the spec's `Source:` header — that header exists only in arms B and `ALL`, so parsing it per arm would make the baseline fail vacuously and fake an effect for B.

- [ ] **Step 1: Write the failing grader test**

```javascript
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { grade } from './grade.mjs'

const P = over => ({ toolCalls: [], answerText: '', result: { subtype: 'success', num_turns: 2, total_cost_usd: 0.01 }, ...over })
const dest = (expect, forbid = []) => ({ family: 'routing', grade: { type: 'destination', expect, forbid } })
const log = predicate => ({ family: 'behavioral', grade: { type: 'tool-log', predicate } })

test('destination passes on the expected path from the json field', () => {
  const p = P({ answerText: '{"destination":"ARCHITECTURE.md"}' })
  assert.equal(grade(p, dest(['ARCHITECTURE.md'])).verdict, 'pass')
})

test('destination matches a glob member', () => {
  const p = P({ answerText: '{"destination":"docs/guidelines/nextjs-runtime.md"}' })
  assert.equal(grade(p, dest(['docs/guidelines/**'])).verdict, 'pass')
})

test('destination fails a forbidden answer', () => {
  const p = P({ answerText: '{"destination":"docs/guidelines/validation.md"}' })
  assert.equal(grade(p, dest(['docs/specs/**'], ['docs/guidelines/**'])).verdict, 'fail')
})

test('reasoning that names a forbidden path outside the field does not fail', () => {
  const p = P({ answerText: 'A guideline is tempting, but the subject is the unit.\n{"destination":"docs/specs/domains/transaction.md"}' })
  assert.equal(grade(p, dest(['docs/specs/**'], ['docs/guidelines/**'])).verdict, 'pass')
})

test('tool-log ordering compares first occurrences', () => {
  const early = P({ toolCalls: [
    { name: 'Write', paths: ['lib/money.ts'] },
    { name: 'Read', paths: ['docs/decisions/0004-money-integer-cents.md'] },
    { name: 'Write', paths: ['db/schema.ts'] },
  ] })
  const c = log('saw(Read:docs/decisions/0004-*) before saw(Write:**)')
  assert.equal(grade(early, c).verdict, 'fail', 'write-then-read must not pass')

  const ordered = P({ toolCalls: [
    { name: 'Read', paths: ['docs/decisions/0004-money-integer-cents.md'] },
    { name: 'Write', paths: ['db/schema.ts'] },
  ] })
  assert.equal(grade(ordered, c).verdict, 'pass')
})

test('tool-log matches a Bash path', () => {
  const p = P({ toolCalls: [{ name: 'Bash', paths: ['domain/transaction'] }] })
  assert.equal(grade(p, log('saw(Bash:domain/transaction**)')).verdict, 'pass')
})

test('a broken run is error, never fail', () => {
  const p = P({ answerText: 'Not logged in · Please run /login', result: { subtype: 'success', num_turns: 1, total_cost_usd: 0 } })
  assert.equal(grade(p, dest(['ARCHITECTURE.md'])).verdict, 'error')
})

test('a timeout is error', () => {
  const p = P({ timedOut: true })
  assert.equal(grade(p, log('saw(Read:**)')).verdict, 'error')
})

test('tool alternation matches either tool', () => {
  const c = log('saw(Write|Edit:ARCHITECTURE.md)')
  assert.equal(grade(P({ toolCalls: [{ name: 'Edit', paths: ['ARCHITECTURE.md'] }] }), c).verdict, 'pass')
  assert.equal(grade(P({ toolCalls: [{ name: 'Write', paths: ['ARCHITECTURE.md'] }] }), c).verdict, 'pass')
  assert.equal(grade(P({ toolCalls: [{ name: 'Read', paths: ['ARCHITECTURE.md'] }] }), c).verdict, 'fail')
})

test('a read via Bash counts when the term uses the * tool', () => {
  const p = P({ toolCalls: [{ name: 'Bash', raw: 'cat docs/decisions/0004-money-integer-cents.md', paths: ['docs/decisions/0004-money-integer-cents.md'] }] })
  assert.equal(grade(p, log('saw(*:docs/decisions/0004-*)')).verdict, 'pass')
  assert.equal(grade(p, log('saw(Read:docs/decisions/0004-*)')).verdict, 'fail', 'a tool-pinned read term throws the Bash projection away')
})

test('b03 does not credit a bare listing of the drift path', () => {
  const c = log('saw(Bash:*git*log*domain/transaction*)')
  assert.equal(grade(P({ toolCalls: [{ name: 'Bash', raw: 'ls domain/transaction', paths: ['domain/transaction'] }] }), c).verdict, 'fail')
  assert.equal(grade(P({ toolCalls: [{ name: 'Bash', raw: 'git log abc123..HEAD -- domain/transaction', paths: ['domain/transaction'] }] }), c).verdict, 'pass')
})

test('a routing run that used tools is an error, not a verdict', () => {
  const p = P({ answerText: '{"destination":"ARCHITECTURE.md"}', toolCalls: [{ name: 'Read', paths: ['ARCHITECTURE.md'] }] })
  assert.equal(grade(p, dest(['ARCHITECTURE.md'])).verdict, 'error')
})

test('a malformed predicate is an error, not a crash', () => {
  assert.equal(grade(P({ toolCalls: [] }), log('nonsense')).verdict, 'error')
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test evals/runner/grade.test.mjs`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `grade.mjs`**

```javascript
import { isBroken } from './invoke.mjs'

const toRe = glob => new RegExp('^' + glob
  .replace(/[.+^${}()|[\]\\]/g, '\\$&')
  .replace(/\*\*/g, ' ')
  .replace(/\*/g, '[^/]*')
  .replace(/ /g, '.*') + '$')

const matches = (path, glob) => toRe(glob).test(path) || toRe(glob).test(path.replace(/^.*?(?=docs\/|domain\/|lib\/|db\/|app\/)/, ''))

function firstIndex(toolCalls, tool, glob) {
  const tools = tool.split('|')
  for (let i = 0; i < toolCalls.length; i++) {
    const c = toolCalls[i]
    if (!tools.includes('*') && !tools.includes(c.name)) continue
    // For Bash, also match the glob against the whole command: `git log ... -- domain/transaction`
    // is a drift check, `ls domain/transaction` is not, and only the raw string distinguishes them.
    if (c.paths.some(p => matches(p, glob))) return i
    if (c.name === 'Bash' && c.raw && matches(String(c.raw), glob)) return i
  }
  return -1
}

// The tool group admits alternation — `Write|Edit` — because an agent editing an existing file
// uses Edit, and a predicate that names only Write false-fails every real consolidation.
const TERM = /^saw\(([A-Za-z*|]+):(.+)\)$/

function evalPredicate(toolCalls, predicate) {
  const [lhs, rhs] = predicate.split(/\s+before\s+/).map(s => s.trim())
  const parse = t => { const m = t.match(TERM); if (!m) throw new Error(`bad predicate term: ${t}`); return [m[1], m[2]] }
  const a = firstIndex(toolCalls, ...parse(lhs))
  if (rhs === undefined) return { ok: a >= 0, reason: a >= 0 ? `saw ${lhs} at ${a}` : `never saw ${lhs}` }
  const b = firstIndex(toolCalls, ...parse(rhs))
  if (a < 0) return { ok: false, reason: `never saw ${lhs}` }
  if (b < 0) return { ok: true, reason: `saw ${lhs}; ${rhs} never happened` }
  return { ok: a < b, reason: `${lhs}@${a} vs ${rhs}@${b}` }
}

function destinationOf(answerText) {
  try { const o = JSON.parse(answerText); if (typeof o?.destination === 'string') return o.destination } catch { /* fall through */ }
  const m = answerText.match(/"destination"\s*:\s*"([^"]+)"/)
  if (m) return m[1]
  const lines = answerText.split('\n').map(s => s.trim()).filter(Boolean)
  return lines.length ? lines[lines.length - 1] : ''
}

export function grade(parsed, caseObj) {
  if (parsed.timedOut) return { verdict: 'error', reason: 'timed out' }
  const broken = isBroken(parsed)
  if (broken) return { verdict: 'error', reason: broken }

  const g = caseObj.grade
  if (g.type === 'destination') {
    // DESIGN § Delivery promises routing runs use no tools. Nothing in the CLI enforces that,
    // so assert it here: a routing run that read the tree was not the controlled condition.
    if (parsed.toolCalls.length > 0)
      return { verdict: 'error', reason: `routing run used ${parsed.toolCalls.length} tool call(s); context was not controlled` }
    const d = destinationOf(parsed.answerText).replace(/^\.?\//, '')
    if (!d) return { verdict: 'error', reason: 'no destination in answer' }
    if ((g.forbid ?? []).some(f => matches(d, f))) return { verdict: 'fail', reason: `forbidden destination ${d}` }
    const ok = g.expect.some(e => matches(d, e))
    return { verdict: ok ? 'pass' : 'fail', reason: `destination ${d}` }
  }
  // A malformed predicate must not kill a run that has already cost hours.
  try {
    const r = evalPredicate(parsed.toolCalls, g.predicate)
    return { verdict: r.ok ? 'pass' : 'fail', reason: r.reason }
  } catch (e) {
    return { verdict: 'error', reason: `predicate error: ${e.message}` }
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test evals/runner/grade.test.mjs`
Expected: 14 passing tests. Absolute-path normalization happens in `invoke()`, where `dir` is known — `matches`'s prefix-stripping clause is only a belt for relative paths embedded in Bash commands, and it cannot help root-level files like `ARCHITECTURE.md`, which have no `docs/`-style marker to anchor on.

- [ ] **Step 5: Add the self-check mode**

Append to `grade.mjs`:

```javascript
if (import.meta.url === `file://${process.argv[1]}`) {
  const { readdirSync, readFileSync } = await import('node:fs')
  const { join } = await import('node:path')
  const { parseCase } = await import('./schema.mjs')
  const { parseStream } = await import('./invoke.mjs')
  const suite = process.argv[3]
  const golden = join(suite, 'results/golden')
  let diffs = 0, n = 0
  for (const f of readdirSync(golden).filter(f => f.endsWith('.json'))) {
    const rec = JSON.parse(readFileSync(join(golden, f), 'utf8'))
    const c = parseCase(readFileSync(join(suite, rec.casePath), 'utf8'))
    const v = grade(parseStream(readFileSync(join(golden, rec.streamFile), 'utf8')), c).verdict
    n++
    if (v !== rec.verdict) { diffs++; console.error(`DIFF ${f}: frozen ${rec.verdict}, now ${v}`) }
  }
  console.log(diffs === 0 ? `OK grader reproduces ${n} frozen verdicts` : `${diffs}/${n} verdicts changed`)
  process.exit(diffs === 0 ? 0 : 1)
}
```

Run: `node evals/runner/grade.mjs --self-check evals/operating-model`
Expected before calibration: it reads an empty or missing `results/golden` — create the directory with a `.gitkeep` and expect `OK grader reproduces 0 frozen verdicts`.

- [ ] **Step 6: Commit**

```bash
git add evals/runner
git commit -m "feat: add mechanical grader with golden self-check"
```

---

### Task 8: The driver, calibration run, and golden freeze

**Files:**
- Create: `evals/runner/run.mjs`
- Create: `evals/README.md`
- Create: `evals/operating-model/README.md`
- Create: `evals/operating-model/results/golden/.gitkeep`

**Interfaces:**
- Consumes: `stage`, `selfCheck`, `invoke`, `grade`, `parseCase`, `validateCase`, `armsFor`.
- Produces: `results/<run-id>/{runs.jsonl,streams/*.txt}` where each `runs.jsonl` line is `{caseId, casePath, arm, model, rep, verdict, reason, streamFile, resolvedModel, hookEvents, costUsd}`.

- [ ] **Step 1: Implement `run.mjs`**

```javascript
import { readdirSync, readFileSync, writeFileSync, mkdirSync, appendFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseCase, validateCase, armsFor } from './schema.mjs'
import { stage, selfCheck } from './stage.mjs'
import { invoke, composeRoutingPrompt } from './invoke.mjs'
import { grade } from './grade.mjs'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const has = k => process.argv.includes(k)

const suite = arg('--suite', 'evals/operating-model')
const runId = arg('--run-id')
const repsOverride = arg('--reps') ? Number(arg('--reps')) : null
const only = arg('--case')
const isolated = !has('--allow-contaminated')
if (!runId) { console.error('--run-id is required (e.g. calibration-1, full-1)'); process.exit(2) }
if (!isolated) console.warn('WARNING: running with host settings loaded. Hooks will fire in every run; contamination is arm-invariant but can mask bundle B.')

const SCHEMA = JSON.stringify({ type: 'object', properties: { destination: { type: 'string' } }, required: ['destination'], additionalProperties: false })
const baselineSha = readFileSync(join(suite, 'arms/BASELINE_SHA'), 'utf8').trim()
const outDir = join(suite, 'results', runId)
mkdirSync(join(outDir, 'streams'), { recursive: true })
const ledger = join(outDir, 'runs.jsonl')

const cases = []
for (const fam of ['routing', 'behavioral']) {
  for (const f of readdirSync(join(suite, 'cases', fam)).filter(f => f.endsWith('.md')).sort()) {
    const casePath = join('cases', fam, f)
    const c = parseCase(readFileSync(join(suite, casePath), 'utf8'))
    const errs = validateCase(c)
    if (errs.length) { console.error(`invalid case ${f}: ${errs.join('; ')}`); process.exit(2) }
    if (!only || c.id.startsWith(only)) cases.push({ ...c, casePath })
  }
}

let done = 0
for (const c of cases) {
  for (const arm of armsFor(c)) {
    for (const [model, reps] of Object.entries(c.reps)) {
      for (let rep = 1; rep <= (repsOverride ?? reps); rep++) {
        const { dir, cleanup } = stage({ suite, arm, world: c.world, baselineSha })
        const bad = selfCheck(dir, arm)
        if (bad.length) { cleanup(); console.error(`ABORT materialization self-check failed for ${arm}: ${bad.join('; ')}`); process.exit(1) }
        // Routing: one turn, no tools, so the context is assembled into the prompt.
        // Behavioral: the agent explores the staged tree itself.
        const prompt = c.family === 'routing' ? composeRoutingPrompt(dir, c.prompt) : c.prompt
        const p = await invoke({ dir, prompt, model, family: c.family, caps: c.caps,
          jsonSchema: c.family === 'routing' ? SCHEMA : null, isolated })
        const { verdict, reason } = grade(p, c)
        const streamFile = `streams/${c.id}-${arm}-${model}-${rep}.txt`
        writeFileSync(join(outDir, streamFile), p.events.map(e => JSON.stringify(e)).join('\n'))
        appendFileSync(ledger, JSON.stringify({ caseId: c.id, casePath: c.casePath, arm, model, rep,
          predicts: c.predicts, verdict, reason, streamFile, resolvedModel: p.model,
          hookEvents: p.hookEvents, costUsd: p.result?.total_cost_usd ?? null, isolated }) + '\n')
        cleanup()
        done++
        console.log(`[${done}] ${c.id} ${arm} ${model} #${rep} → ${verdict} (${reason})`)
      }
    }
  }
}
console.log(`\n${done} runs → ${ledger}`)
```

- [ ] **Step 2: Dry-run one routing case at N=1 to shake out plumbing**

```bash
node evals/runner/run.mjs --suite evals/operating-model --run-id smoke-1 --case r01 --reps 1
```

Expected: three lines (baseline, A, ALL) per model, each ending in `pass`, `fail`, or `error` with a reason. Any `error` whose reason mentions auth means Task 6 Step 5 was not completed. **Run this from a real terminal, not from inside a Claude Code session.**

- [ ] **Step 3: Full calibration run at N=1**

```bash
node evals/runner/run.mjs --suite evals/operating-model --run-id calibration-1 --reps 1
```

Expected: 80 runs (46 case-arm combinations, routing ones on both tiers). Check `costUsd` is non-zero on every line and `hookEvents` is 0 in isolated mode.

- [ ] **Step 4: Hand-review every calibration verdict**

Read all 80 lines of `results/calibration-1/runs.jsonl`, and for every one open its stream file and confirm the verdict is what a careful human would give. This is the one step in the whole suite where a human forms an opinion, and it is what makes the grader trustworthy afterwards. Specifically check:

- multi-line routing answers, for hedges above the JSON field — if the `--json-schema` field is honored, there should be none, and if hedges appear anyway, the field extraction is still correct and no change is needed;
- behavioral runs, for whether the graded action happened *near* the budget or timeout cap — if any did, raise that case's caps before the full run;
- every `error`, for whether it is genuinely infrastructural.

- [ ] **Step 5: Freeze the golden set**

```bash
mkdir -p evals/operating-model/results/golden/streams
cd evals/operating-model/results
while read -r l; do
  id=$(node -e 'const j=JSON.parse(process.argv[1]);console.log(`${j.caseId}-${j.arm}-${j.model}-${j.rep}`)' "$l")
  node -e 'const j=JSON.parse(process.argv[1]);j.streamFile="streams/"+j.streamFile.split("/").pop();console.log(JSON.stringify(j,null,2))' "$l" > "golden/$id.json"
  cp "calibration-1/$(node -e 'console.log(JSON.parse(process.argv[1]).streamFile)' "$l")" "golden/streams/"
done < calibration-1/runs.jsonl
cd - && node evals/runner/grade.mjs --self-check evals/operating-model
```

Expected: `OK grader reproduces 80 frozen verdicts`. From now on, any grader change that alters a frozen verdict is a regression to be justified or reverted.

- [ ] **Step 6: Write both READMEs**

`evals/README.md`: what a suite is, the directory convention, and `node evals/runner/run.mjs --suite <dir> --run-id <id>`.

`evals/operating-model/README.md`: how to run, how to read the report, and — copied verbatim from `DESIGN.md`'s *Limits* section — every limit, plus which isolation mode the frozen golden set was produced in.

- [ ] **Step 7: Commit**

```bash
git add evals
git commit -m "feat: add eval driver, calibration run, and frozen golden set"
```

---

### Task 9: Report and the full run

**Files:**
- Create: `evals/runner/report.mjs`
- Create: `evals/runner/report.test.mjs`

**Interfaces:**
- Consumes: a `runs.jsonl` ledger.
- Produces: `tally(records) -> {byTier: {tier: {caseId: {arm: {pass, n, rate}}}}, bundleDeltas, callouts}` and a markdown renderer.

- [ ] **Step 1: Write the failing report test**

```javascript
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { tally } from './report.mjs'

const rec = (caseId, arm, model, verdict, n = 1) =>
  Array.from({ length: n }, (_, i) => ({ caseId, arm, model, rep: i + 1, verdict, predicts: 'control' }))

test('errors are excluded from the denominator', () => {
  const t = tally([...rec('r01', 'baseline', 'haiku', 'pass', 3), ...rec('r01', 'baseline', 'haiku', 'error', 2)])
  assert.equal(t.byTier.haiku.r01.baseline.n, 3)
  assert.equal(t.byTier.haiku.r01.baseline.rate, 1)
  assert.equal(t.byTier.haiku.r01.baseline.errors, 2)
})

test('tiers are never pooled', () => {
  const t = tally([...rec('r01', 'baseline', 'haiku', 'pass', 2), ...rec('r01', 'baseline', 'opus', 'fail', 2)])
  assert.equal(t.byTier.haiku.r01.baseline.rate, 1)
  assert.equal(t.byTier.opus.r01.baseline.rate, 0)
})

test('control regression fires when a control drops by more than 2 reps', () => {
  const t = tally([
    ...rec('r11', 'baseline', 'haiku', 'pass', 10),
    ...rec('r11', 'ALL', 'haiku', 'pass', 7), ...rec('r11', 'ALL', 'haiku', 'fail', 3),
  ])
  assert.ok(t.callouts.some(c => c.kind === 'control-regression' && c.caseId === 'r11'))
})

test('theoretical finding fires when a predicted-fail case passes baseline at 80% on both tiers', () => {
  const mk = (model, n) => Array.from({ length: n }, () => ({ caseId: 'r06', arm: 'baseline', model, verdict: 'pass', predicts: 'fail-on-baseline' }))
  const t = tally([...mk('haiku', 10), ...mk('opus', 5)])
  assert.ok(t.callouts.some(c => c.kind === 'theoretical-finding' && c.caseId === 'r06'))
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test evals/runner/report.test.mjs`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `report.mjs`**

```javascript
const BUNDLES = { A: 'A', B: 'B', C: 'C' }

export function tally(records) {
  const byTier = {}
  for (const r of records) {
    const t = (byTier[r.model] ??= {})
    const c = (t[r.caseId] ??= {})
    const a = (c[r.arm] ??= { pass: 0, n: 0, errors: 0, predicts: r.predicts })
    if (r.verdict === 'error') a.errors++
    else { a.n++; if (r.verdict === 'pass') a.pass++ }
    a.predicts ??= r.predicts
  }
  for (const t of Object.values(byTier)) for (const c of Object.values(t)) for (const a of Object.values(c)) a.rate = a.n ? a.pass / a.n : null

  const callouts = []
  for (const [tier, cases] of Object.entries(byTier)) {
    for (const [caseId, arms] of Object.entries(cases)) {
      const base = arms.baseline
      if (!base || base.rate === null) continue
      const predicts = base.predicts ?? Object.values(arms).find(a => a.predicts)?.predicts
      for (const [arm, a] of Object.entries(arms)) {
        if (arm === 'baseline' || a.rate === null) continue
        // Compare RATES, not pass counts. Errors shrink denominators, so counts are not
        // comparable: 5/5 against a baseline 10/10 would fire a false regression, while a real
        // 5/5 → 3/10 collapse would hide. "More than two reps" is expressed against the
        // surviving denominator.
        if (predicts === 'control' && base.rate - a.rate > 2 / Math.max(base.n, a.n))
          callouts.push({ kind: 'control-regression', tier, caseId, arm, from: base.rate, to: a.rate })
      }
      if (predicts === 'fail-on-baseline' && base.rate >= 0.8) {
        // Every tier that RUNS the case must agree — not "more than one tier". Behavioral cases
        // are Opus-only, so requiring two tiers would make them unflaggable forever.
        const tiers = Object.entries(byTier).filter(([, cs]) => cs[caseId]?.baseline?.rate != null)
        if (tiers.length >= 1 && tiers.every(([, cs]) => cs[caseId].baseline.rate >= 0.8) && !callouts.some(c => c.kind === 'theoretical-finding' && c.caseId === caseId))
          callouts.push({ kind: 'theoretical-finding', caseId, rates: Object.fromEntries(tiers.map(([m, cs]) => [m, cs[caseId].baseline.rate])) })
      }
    }
  }

  // Headline deltas are computed over predicted-fail cases only. Controls are flat by
  // construction, so including them dilutes every bundle toward zero — one working edit plus
  // one flat control reports 0.5 for an edit that worked perfectly. Controls have their own
  // call-out; they are not part of the effect size.
  const bundleDeltas = {}
  for (const [tier, cases] of Object.entries(byTier)) {
    bundleDeltas[tier] = {}
    for (const arm of [...Object.keys(BUNDLES), 'ALL']) {
      const ds = Object.values(cases)
        .filter(c => c[arm]?.rate != null && c.baseline?.rate != null
          && (c.baseline.predicts ?? Object.values(c).find(a => a.predicts)?.predicts) === 'fail-on-baseline')
        .map(c => c[arm].rate - c.baseline.rate)
      bundleDeltas[tier][arm] = ds.length ? ds.reduce((a, b) => a + b, 0) / ds.length : null
    }
  }
  return { byTier, bundleDeltas, callouts }
}

export function render(t) {
  const pct = v => v === null ? '—' : `${Math.round(v * 100)}%`
  const out = []
  for (const [tier, cases] of Object.entries(t.byTier)) {
    out.push(`## ${tier}\n`)
    const arms = ['baseline', 'A', 'B', 'C', 'ALL']
    out.push(`| case | ${arms.join(' | ')} |`, `|---|${arms.map(() => '---').join('|')}|`)
    for (const [caseId, a] of Object.entries(cases).sort()) {
      out.push(`| ${caseId} | ` + arms.map(arm => {
        const x = a[arm]
        if (!x || x.rate === null) return '—'
        const d = arm === 'baseline' || !a.baseline || a.baseline.rate === null ? '' : ` (${x.rate - a.baseline.rate >= 0 ? '+' : ''}${Math.round((x.rate - a.baseline.rate) * 100)})`
        return `${x.pass}/${x.n}${d}${x.errors ? ` !${x.errors}` : ''}`
      }).join(' | ') + ' |')
    }
    out.push('', `Bundle deltas: ` + Object.entries(t.bundleDeltas[tier]).map(([k, v]) => `${k} ${pct(v)}`).join(', '), '')
  }
  if (t.callouts.length) {
    out.push('## Call-outs\n')
    for (const c of t.callouts) out.push(`- **${c.kind}** ${c.caseId}${c.arm ? ` (${c.arm}, ${c.tier})` : ''} ${JSON.stringify(c.rates ?? { from: c.from, to: c.to })}`)
  } else out.push('## Call-outs\n\nNone.')
  return out.join('\n')
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { readFileSync } = await import('node:fs')
  const recs = readFileSync(process.argv[2], 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l))
  console.log(render(tally(recs)))
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test evals/runner/report.test.mjs`
Expected: 4 passing tests.

- [ ] **Step 5: Run the full suite, all five arms**

```bash
node evals/runner/run.mjs --suite evals/operating-model --run-id full-1
```

Expected: 546 runs — 510 routing (34 case-arm combinations × 15 reps) and 36 behavioral. Hours of wall clock. Watch for `ABORT materialization self-check failed`, which means an arm's fixture is wrong and every number after it would be meaningless.

- [ ] **Step 6: Render and commit the numbers**

```bash
node evals/runner/report.mjs evals/operating-model/results/full-1/runs.jsonl > evals/operating-model/results/full-1/REPORT.md
cat evals/operating-model/results/full-1/REPORT.md
git add evals/operating-model/results
git commit -m "chore: record full-1 eval run and report"
```

- [ ] **Step 7: Read the report against the design's predictions**

Three questions, in order:

1. Did any **control regress**? That is an edit breaking something that worked, and it outranks every positive result.
2. Did any **predicted-fail case pass baseline** at 80%+ on both tiers? That finding was theoretical, and the design says to report it — including in `DESIGN.md`, which claimed it.
3. Is `b03` failing on arm `B` as well as baseline? If so, reconcile markers get written and never read, and edit 3 should not ship. This is the cheapest thing this suite can tell you.

A null result on bundle C is expected and is not evidence against edits 8 and 9 — the design says so, and reading it as a verdict against them would be the one misinterpretation the whole suite is built to prevent.

---

## Out of scope

Applying the nine edits to `harness/operating-model.md` is deliberately not a task here. The sha-pinned baseline means the measurement does not depend on when they land, so landing them is a separate change gated on reading the report — not on this plan finishing.
