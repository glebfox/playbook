const ARMS = ['A', 'B', 'C']
const FAMILIES = ['routing', 'behavioral']
const PREDICTS = ['fail-on-baseline', 'control']
const WORLDS = ['month-3', 'day-1', 'month-3-mid-increment']
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
    // `before` (right side optional) and `then` (right side required) — see grade.mjs.
    for (const t of String(g.predicate).split(/\s+(?:before|then)\s+/))
      if (!/^saw\([A-Za-z*|]+:.+\)$/.test(t.trim())) e.push(`malformed predicate term: ${t.trim()}`)
  }
  return e
}

export function armsFor(c) {
  return ['baseline', ...(c.targets ?? []), 'ALL']
}
