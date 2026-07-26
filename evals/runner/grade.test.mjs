import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { grade } from './grade.mjs'
import { parseCase } from './schema.mjs'

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

// The real shape of a routing answer, captured from a live haiku run: the validated object arrives
// as a StructuredOutput tool call, while the text block holds a fenced copy plus reasoning prose.
// Grading the field and ignoring the prose is what keeps arm C from being penalised for articulating
// the very trade-off its edit teaches.
test('the destination is read from the validated StructuredOutput field, not the prose', () => {
  const p = P({
    structuredOutput: { destination: 'ARCHITECTURE.md' },
    answerText: '```json\n{"destination": "ARCHITECTURE.md"}\n```\n\nThis is an **architectural convention** about how the system represents money. A guideline would be wrong here.',
  })
  assert.equal(grade(p, dest(['ARCHITECTURE.md'], ['docs/guidelines/**'])).verdict, 'pass',
    'the prose names a forbidden path while rejecting it; only the field counts')
})

test('StructuredOutput does not count as a tool call', () => {
  // It is how --json-schema delivers the answer, so counting it would score every routing run error.
  const p = P({ structuredOutput: { destination: 'ARCHITECTURE.md' }, toolCalls: [] })
  assert.equal(grade(p, dest(['ARCHITECTURE.md'])).verdict, 'pass')
})

test('a routing run that used tools is an error, not a verdict', () => {
  const p = P({ answerText: '{"destination":"ARCHITECTURE.md"}', toolCalls: [{ name: 'Read', paths: ['ARCHITECTURE.md'] }] })
  assert.equal(grade(p, dest(['ARCHITECTURE.md'])).verdict, 'error')
})

test('a malformed predicate is an error, not a crash', () => {
  assert.equal(grade(P({ toolCalls: [] }), log('nonsense')).verdict, 'error')
})

test('"NONE" — the contract\'s no-legal-home answer — is a fail, not an error', () => {
  const p = P({ answerText: '{"destination":"NONE"}' })
  const r = grade(p, dest(['ARCHITECTURE.md']))
  assert.equal(r.verdict, 'fail', 'the fact has a home; answering NONE is a wrong answer, not a broken run')
  assert.match(r.reason, /NONE/)
})

// The four predicates as they are written in the case files, executed against logs of the shape a
// real session produces. `validateCase` only checks their form; until this ran, nothing had ever
// evaluated them — and a predicate that cannot match its own case scores every arm 'fail' and reads
// as a null result. Read the case file rather than retyping the predicate, or the test drifts free.
const behavioral = id => parseCase(readFileSync(`evals/operating-model/cases/behavioral/${id}.md`, 'utf8'))

test('each behavioral predicate accepts the intended log and rejects the near-miss', () => {
  const cases = [
    ['b01-numeric-migration',
      [{ name: 'Read', paths: ['docs/decisions/0004-money-integer-cents.md'] }, { name: 'Edit', paths: ['db/schema.ts'] }],
      [{ name: 'Edit', paths: ['db/schema.ts'] }, { name: 'Read', paths: ['docs/decisions/0004-money-integer-cents.md'] }]],
    ['b02-csv-import-design',
      [{ name: 'Read', paths: ['docs/guidelines/nextjs-runtime.md'] }, { name: 'Write', paths: ['docs/increments/active/2026-07-26-csv-import/design.md'] }],
      [{ name: 'Write', paths: ['docs/increments/active/2026-07-26-csv-import/design.md'] }, { name: 'Read', paths: ['docs/guidelines/nextjs-runtime.md'] }]],
    ['b03-spec-drift-check',
      [{ name: 'Bash', raw: 'git log 8ea0993..HEAD -- domain/transaction', paths: ['domain/transaction'] }],
      [{ name: 'Bash', raw: 'ls domain/transaction', paths: ['domain/transaction'] }]],
    ['b04-consolidate-increment',
      [{ name: 'Edit', paths: ['ARCHITECTURE.md'] }],
      [{ name: 'Edit', paths: ['docs/specs/domains/transaction.md'] }]],
  ]
  for (const [id, good, bad] of cases) {
    const c = behavioral(id)
    assert.equal(grade(P({ toolCalls: good }), c).verdict, 'pass', `${id} must pass its intended log`)
    assert.equal(grade(P({ toolCalls: bad }), c).verdict, 'fail', `${id} must reject its near-miss`)
  }
})

// Every routing case's expect must be reachable: a stale or mistyped glob matches no real path, so
// every arm fails the case and the result reads as a flat null instead of a broken expectation.
// Nothing else in the suite checks this — `validate.mjs` only sees the case's shape.
test('every routing case expects a path that exists in its own world', async () => {
  const { readdirSync } = await import('node:fs')
  const { execFileSync } = await import('node:child_process')
  const { stage } = await import('./stage.mjs')
  const suite = 'evals/operating-model'
  const sha = readFileSync(`${suite}/arms/BASELINE_SHA`, 'utf8').trim()

  const trees = {}
  for (const world of ['month-3', 'day-1']) {
    const s = stage({ suite, arm: 'ALL', world, baselineSha: sha })
    trees[world] = execFileSync('git', ['-C', s.dir, 'ls-files'], { encoding: 'utf8' }).trim().split('\n')
    s.cleanup()
  }

  const dir = `${suite}/cases/routing`
  for (const f of readdirSync(dir).filter(f => f.endsWith('.md')).sort()) {
    const c = parseCase(readFileSync(`${dir}/${f}`, 'utf8'))
    const hits = trees[c.world].filter(p => grade(P({ answerText: JSON.stringify({ destination: p }) }), c).verdict === 'pass')
    assert.ok(hits.length > 0, `${c.id}: no path in the ${c.world} tree satisfies expect ${JSON.stringify(c.grade.expect)}`)
  }
})

test('b03 accepts all four realistic spellings of the drift check and no other git command', () => {
  const c = behavioral('b03-spec-drift-check')
  const bash = raw => P({ toolCalls: [{ name: 'Bash', raw, paths: ['domain/transaction'] }] })
  for (const raw of [
    'git log 8ea0993..HEAD -- domain/transaction/',
    'git log 8ea0993..HEAD -- domain/transaction lib/money.ts',   // names both Source: paths
    'git log 8ea0993..HEAD -- "domain/transaction/**"',
    'git log -p domain/transaction/rules.ts',
  ]) assert.equal(grade(bash(raw), c).verdict, 'pass', `must accept: ${raw}`)

  // Anchored on `log`: `git add`/`git commit` are run by any implementing agent, and `git diff`
  // is not the check. Crediting those would pass the case for work unrelated to drift.
  for (const raw of [
    'git diff HEAD -- domain/transaction',
    'git add domain/transaction',
    'git commit -m "feat: add the rule" domain/transaction',
    'cat domain/transaction/rules.ts',
  ]) assert.equal(grade(bash(raw), c).verdict, 'fail', `must reject: ${raw}`)
})
