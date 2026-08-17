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
