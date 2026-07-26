import { execFile, execFileSync } from 'node:child_process'
import { readFileSync, existsSync, realpathSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const PATH_RE = /(?:[\w.@-]+\/)+[\w.@*-]+|\b[\w-]+\.(?:md|ts|tsx|json|sh|mjs)\b/g

// DESIGN.md § Delivery, as revised after the first calibration run.
//
// The vendored `docs/operating-model.md` is deliberately NOT injected. Injecting it produced a
// ceiling: 68 routing runs, baseline 100% on every case and both tiers, all six predicted-fail
// cases flagged as theoretical findings. Handing the model the complete rulebook in-context removes
// the very condition the panel's findings came from — a session that follows the thin CLAUDE.md map
// and never opens the full model. What remains is what such a session actually holds: the map, the
// file tree, and the two specs it would have open.
//
// The cost is explicit and accepted: bundle C is all document body, so it is now invisible here.
// It stays observable in the behavioral layer, where the vendored copy sits in the tree and an agent
// may read it — the first thing b01's session did.
const ROUTING_CONTEXT = [
  'CLAUDE.md',
  'docs/specs/domains/transaction.md',
  'docs/specs/domains/budget.md',
]

// In the `day-1` world, ARCHITECTURE.md's content is arm-owned: the status line is edit 1's
// payload and the only channel by which arm A's fixture half can reach a one-turn, no-tools run.
// Leaving it out would let stage() write an artifact selfCheck verifies and the model never sees —
// the vacuous pass DESIGN.md warns about. It stays out in `month-3`, where the file is identical
// in every arm and injecting it would only make the destination more salient for the three cases
// that expect it, inflating the baseline and biasing bundle A's delta toward null.
const DAY_1_EXTRA = ['ARCHITECTURE.md']

// Deny every tool. A wildcard rather than a name list, because a list is a maintenance trap: the
// first version named fourteen tools and Opus escaped it through `ToolSearch`, the deferred-tool
// loader, which nobody thought to include. `*` closes the class instead of chasing it.
// Verified: `StructuredOutput` still arrives, because the schema mechanism is not gated by this flag.
const ROUTING_DENY = '*'

export function composeRoutingPrompt(dir, question, world = existsSync(join(dir, 'docs/specs')) ? 'month-3' : 'day-1') {
  const parts = []
  const context = world === 'day-1' ? [ROUTING_CONTEXT[0], ...DAY_1_EXTRA, ...ROUTING_CONTEXT.slice(1)] : ROUTING_CONTEXT
  for (const rel of context) {
    const abs = join(dir, rel)
    if (!existsSync(abs)) continue   // day-1 world legitimately lacks the specs
    parts.push(`===== ${rel} =====\n${readFileSync(abs, 'utf8').trim()}`)
  }
  const tree = execFileSync('git', ['-C', dir, 'ls-files'], { encoding: 'utf8' }).trim()
  parts.push(`===== file tree =====\n${tree}`)
  parts.push(`===== new fact =====\n${question}`)
  parts.push(`===== task =====\n${OUTPUT_CONTRACT}`)
  return parts.join('\n\n')
}

// The contract lives here, not in the twelve case files: appending it once by construction is
// what makes the cases uniform. Twelve hand-copied contracts would drift, and a drifted contract
// changes what the grader is reading.
const OUTPUT_CONTRACT = `Following the documentation and workflow model this project uses, decide where this fact belongs.

It has exactly one home. Reply with a JSON object and nothing else: {"destination": "<repository-relative path>"}. Give the path of a single file — the one that should hold this fact, whether or not that file exists yet. If the documentation model gives the fact no legal home at all, answer {"destination": "NONE"}.`

export function buildArgs({ model, family, caps, jsonSchema, isolated }) {
  const a = ['-p', '--model', model, '--output-format', 'stream-json', '--verbose']
  if (caps?.budgetUsd) a.push('--max-budget-usd', String(caps.budgetUsd))
  if (family === 'routing') {
    // `--safe-mode` is verified to keep subscription auth AND emit zero hook events, which is what
    // removes ANTHROPIC_API_KEY from this suite's requirements. It also disables the project
    // CLAUDE.md, skills and plugins — all irrelevant for routing, because the context is
    // pre-assembled into the prompt. Verified on a real run: 0 hooks, 0 tool calls, schema honored.
    a.push('--safe-mode')
    // `--allowedTools ''` alone is NOT enough, verified the expensive way: Opus read
    // ARCHITECTURE.md straight out of the staged tree with it set, because that flag governs
    // permission pre-approval and a read-only tool needs no approval. Haiku happened not to try,
    // so the gap would have surfaced as ~170 Opus routing runs scoring `error`.
    a.push('--allowedTools', '')
    a.push('--disallowedTools', ROUTING_DENY)
    if (jsonSchema) a.push('--json-schema', jsonSchema)
  } else {
    // Behavioral runs must discover the fixture's CLAUDE.md normally, so `--safe-mode` is out — it
    // would disable the very file bundle B edits. `--setting-sources project` suppresses hooks but
    // drops subscription credentials, so it is usable only with an API key; without one the run
    // loads host settings and hooks fire. That is the only contaminated layer left.
    if (isolated) a.push('--setting-sources', 'project')
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
  let answerText = '', model = null, result = null, hookEvents = 0, apiKeySource = null, structuredOutput = null
  // Observed on a real failed run: the CLI puts `error: "authentication_failed"` on the event and
  // `is_error: true` on the result, alongside `subtype: "success"`. Both are stronger signals than
  // matching the words "Not logged in", which are wording- and locale-dependent.
  const errorFlags = []
  for (const e of events) {
    if (e.error) errorFlags.push(String(e.error))
    if (e.type === 'system') {
      if (String(e.subtype).startsWith('hook')) hookEvents++
      if (e.subtype === 'init') {
        if (e.model) model = e.model
        if (e.apiKeySource) apiKeySource = e.apiKeySource
      }
    } else if (e.type === 'assistant') {
      for (const c of e.message?.content ?? []) {
        if (c.type === 'tool_use') {
          // `--json-schema` delivers the validated object as a tool_use named StructuredOutput.
          // Observed, not assumed. It is harness plumbing rather than the model exploring the tree,
          // so it must stay out of toolCalls: the routing invariant is "no tool calls", and counting
          // this one would score every single routing run `error`.
          if (c.name === 'StructuredOutput') { structuredOutput = c.input ?? null; continue }
          const src = c.input?.file_path ?? c.input?.path ?? c.input?.command ?? JSON.stringify(c.input ?? {})
          toolCalls.push({ name: c.name, raw: src, paths: [...String(src).matchAll(PATH_RE)].map(m => m[0]) })
        } else if (c.type === 'text') answerText += c.text
      }
    } else if (e.type === 'result') result = e
  }
  return { events, toolCalls, answerText: answerText.trim(), model, result, hookEvents, apiKeySource, errorFlags, structuredOutput }
}

export function isBroken(p) {
  if (!p.result) return 'no result event — the run did not complete'
  const authFlag = (p.errorFlags ?? []).find(f => /auth/i.test(f))
  if (authFlag) return `auth failure: the CLI reported ${authFlag}`
  if (/not logged in|please run \/login/i.test(p.answerText)) return 'auth failure: CLI reported "Not logged in"'
  // `subtype: "success"` with `is_error: true` is a real combination, seen on a failed-auth run.
  // Trusting subtype alone is how a broken run scores as a real answer.
  if (p.result.is_error) return `run reported is_error with subtype ${p.result.subtype}`
  if (p.result.subtype === 'success' && p.result.total_cost_usd === 0 && p.result.num_turns <= 1)
    return 'suspicious: success with zero cost and one turn — treat as auth or config failure'
  if (p.result.subtype && p.result.subtype !== 'success') return `result subtype ${p.result.subtype}`
  return null
}

export function invoke({ dir, prompt, model, family, caps, jsonSchema, isolated }) {
  return new Promise(resolve => {
    const args = [...buildArgs({ model, family, caps, jsonSchema, isolated }), prompt]
    // A routing run executes in an EMPTY directory. Its context is pre-assembled, so the staged tree
    // must be unreachable — the second barrier behind --disallowedTools, because a tool call that
    // slipped through would then find nothing rather than the fixture. Behavioral runs must explore
    // the tree, so they run in it.
    const cwd = family === 'routing' ? mkdtempSync(join(tmpdir(), 'routing-cwd-')) : dir
    execFile('claude', args, { cwd, timeout: caps.timeoutMs, maxBuffer: 64 * 1024 * 1024 },
      (err, stdout) => {
        const p = parseStream(stdout ?? '')
        // Real Read/Write/Edit calls carry ABSOLUTE file_paths, so every projected path starts
        // with the staging directory. Strip it here, where `dir` is known — otherwise root-level
        // files (ARCHITECTURE.md, CLAUDE.md) never match any glob and b04 is silently zeroed.
        //
        // Two prefixes, not one: on macOS `tmpdir()` returns /var/folders/…, a symlink to
        // /private/var/…. If the CLI reports paths through the realpath while `dir` holds the
        // symlinked form, a single-prefix strip never matches — and it fails invisibly, because
        // the grade tests use pre-stripped fixtures.
        const prefixes = [...new Set([cwd, realpathSync(cwd)])].map(d => d.replace(/^\//, '') + '/')
        const strip = x => { for (const pre of prefixes) if (x.startsWith(pre)) return x.slice(pre.length); return x }
        for (const c of p.toolCalls) c.paths = c.paths.map(strip)
        if (cwd !== dir) rmSync(cwd, { recursive: true, force: true })
        p.timedOut = Boolean(err && err.killed)
        p.args = args
        resolve(p)
      })
  })
}
