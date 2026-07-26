import { execFile, execFileSync } from 'node:child_process'
import { readFileSync, existsSync, realpathSync } from 'node:fs'
import { join } from 'node:path'

const PATH_RE = /(?:[\w.@-]+\/)+[\w.@*-]+|\b[\w-]+\.(?:md|ts|tsx|json|sh|mjs)\b/g

// DESIGN.md § Delivery: the five parts, in order, identical across arms except arm-owned content.
const ROUTING_CONTEXT = [
  'CLAUDE.md',
  'docs/operating-model.md',
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
        //
        // Two prefixes, not one: on macOS `tmpdir()` returns /var/folders/…, a symlink to
        // /private/var/…. If the CLI reports paths through the realpath while `dir` holds the
        // symlinked form, a single-prefix strip never matches — and it fails invisibly, because
        // the grade tests use pre-stripped fixtures.
        const prefixes = [...new Set([dir, realpathSync(dir)])].map(d => d.replace(/^\//, '') + '/')
        const strip = x => { for (const pre of prefixes) if (x.startsWith(pre)) return x.slice(pre.length); return x }
        for (const c of p.toolCalls) c.paths = c.paths.map(strip)
        p.timedOut = Boolean(err && err.killed)
        p.args = args
        resolve(p)
      })
  })
}
