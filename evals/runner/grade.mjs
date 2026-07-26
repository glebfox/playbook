import { isBroken } from './invoke.mjs'

const toRe = glob => new RegExp('^' + glob
  .replace(/[.+^${}()|[\]\\]/g, '\\$&')
  .replace(/\*\*/g, ' ')
  .replace(/\*/g, '[^/]*')
  .replace(/ /g, '.*') + '$')

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

if (import.meta.url === `file://${process.argv[1]}`) {
  const { readdirSync, readFileSync, existsSync } = await import('node:fs')
  const { join } = await import('node:path')
  const { parseCase } = await import('./schema.mjs')
  const { parseStream } = await import('./invoke.mjs')
  const suite = process.argv[3]
  const golden = join(suite, 'results/golden')
  if (!existsSync(golden)) { console.error(`no golden directory at ${golden} — it is frozen by the calibration run`); process.exit(2) }
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
