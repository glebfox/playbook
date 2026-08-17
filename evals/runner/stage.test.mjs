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
  assert.deepEqual(selfCheck(dir, 'baseline', 'month-3'), [])
  cleanup()
})

test('arm B stage has reconcile markers and the reading order', () => {
  const { dir, cleanup } = stage({ suite, arm: 'B', world: 'month-3', baselineSha: sha })
  assert.match(readFileSync(join(dir, 'docs/specs/domains/transaction.md'), 'utf8'), /^Reconciled:/m)
  assert.match(readFileSync(join(dir, 'CLAUDE.md'), 'utf8'), /## Reading order/)
  assert.deepEqual(selfCheck(dir, 'B', 'month-3'), [])
  cleanup()
})

test('selfCheck catches a marker leaking into the baseline', () => {
  const { dir, cleanup } = stage({ suite, arm: 'B', world: 'month-3', baselineSha: sha })
  assert.ok(selfCheck(dir, 'baseline', 'month-3').length > 0, 'a B tree checked as baseline must fail')
  cleanup()

  // Fixture artifacts alone cannot separate A from C in month-3 — they differ only in the
  // document body — so a swapped or unapplied patch would stage as a valid-looking tree.
  const a = stage({ suite, arm: 'A', world: 'month-3', baselineSha: sha })
  assert.deepEqual(selfCheck(a.dir, 'A', 'month-3'), [])
  assert.ok(selfCheck(a.dir, 'C', 'month-3').length > 0, 'an A tree checked as C must fail on the document')
  assert.ok(selfCheck(a.dir, 'ALL', 'month-3').length > 0, 'an A tree checked as ALL must fail on the document')
  a.cleanup()
})

test('day-1 world contains only whitelisted files, and the status line is arm-owned', () => {
  const a = stage({ suite, arm: 'A', world: 'day-1', baselineSha: sha })
  assert.ok(!existsSync(join(a.dir, 'docs/specs')), 'day-1 has no specs, and no empty specs directory either')
  assert.ok(existsSync(join(a.dir, 'docs/vision.md')))
  assert.match(readFileSync(join(a.dir, 'ARCHITECTURE.md'), 'utf8'), /^Status: nothing built yet/m)
  assert.deepEqual(selfCheck(a.dir, 'A', 'day-1'), [])

  // The overlay, not the month-3 documents: r05 asks where the chosen stack goes, so a vision
  // naming the stack disarms it, and one reporting four landed increments contradicts its premise.
  const vision = readFileSync(join(a.dir, 'docs/vision.md'), 'utf8')
  assert.doesNotMatch(vision, /Next\.js|Postgres|Drizzle|Auth\.js/i, 'day-1 vision must not name the stack')
  assert.doesNotMatch(vision, /\blanded\b|\breconciled\b/i, 'day-1 vision must claim no shipped work')
  assert.doesNotMatch(readFileSync(join(a.dir, 'docs/roadmap.md'), 'utf8'), /\bdone\b/i)
  a.cleanup()

  const b = stage({ suite, arm: 'baseline', world: 'day-1', baselineSha: sha })
  assert.doesNotMatch(readFileSync(join(b.dir, 'ARCHITECTURE.md'), 'utf8'), /^Status: nothing built yet/m)
  assert.ok(selfCheck(b.dir, 'A', 'day-1').length > 0, 'a baseline tree checked as arm A must fail on the status line')
  b.cleanup()
})

test('mid-increment world adds an active increment and keeps the base package.json', () => {
  const { dir, cleanup } = stage({ suite, arm: 'A', world: 'month-3-mid-increment', baselineSha: sha })
  assert.ok(existsSync(join(dir, 'docs/increments/active/2026-07-20-seed-and-backdate/design.md')))
  const pkg = readFileSync(join(dir, 'package.json'), 'utf8')
  assert.match(pkg, /db:seed/, 'the overlay adds the command b04 must consolidate')
  assert.match(pkg, /next/, 'and it is the full base file, not a scripts-only fragment')
  cleanup()
})
