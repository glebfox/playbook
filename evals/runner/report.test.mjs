import { test } from 'node:test'
import assert from 'node:assert/strict'
import { tally, render } from './report.mjs'

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

// The rate-vs-count argument is the whole reason the threshold is written as a rate. Both halves of
// it are asserted here, because a count-based implementation passes every test above.
test('a shrunken denominator is not a regression, and a real collapse is not hidden', () => {
  const clean = tally([
    ...rec('r11', 'baseline', 'haiku', 'pass', 10),
    ...rec('r11', 'ALL', 'haiku', 'pass', 5), ...rec('r11', 'ALL', 'haiku', 'error', 5),
  ])
  assert.equal(clean.callouts.length, 0, '5/5 against a baseline 10/10 is equal performance, not a 5-rep drop')
  assert.equal(clean.byTier.haiku.r11.ALL.errors, 5)

  const collapsed = tally([
    ...rec('r11', 'baseline', 'haiku', 'pass', 5),
    ...rec('r11', 'ALL', 'haiku', 'pass', 3), ...rec('r11', 'ALL', 'haiku', 'fail', 7),
  ])
  assert.ok(collapsed.callouts.some(c => c.kind === 'control-regression'),
    '5/5 → 3/10 is a collapse; under count comparison it reads as a 2-rep drop and hides')
})

test('bundle deltas average over predicted-fail cases only', () => {
  const t = tally([
    // one edit working perfectly
    ...rec('r01', 'baseline', 'haiku', 'fail', 5).map(r => ({ ...r, predicts: 'fail-on-baseline' })),
    ...rec('r01', 'A', 'haiku', 'pass', 5).map(r => ({ ...r, predicts: 'fail-on-baseline' })),
    // beside a flat control, which must not dilute it
    ...rec('r11', 'baseline', 'haiku', 'pass', 5),
    ...rec('r11', 'A', 'haiku', 'pass', 5),
  ])
  assert.equal(t.bundleDeltas.haiku.A, 1, 'including the control would report 0.5 for an edit that worked perfectly')
})

test('a tier that disagrees blocks the theoretical-finding call-out', () => {
  const mk = (model, verdict, n) => Array.from({ length: n }, () => ({ caseId: 'r02', arm: 'baseline', model, verdict, predicts: 'fail-on-baseline' }))
  const split = tally([...mk('haiku', 'fail', 10), ...mk('opus', 'pass', 5)])
  assert.equal(split.callouts.length, 0, 'the finding reproduced on haiku, so it was not theoretical')

  // Behavioral cases run on Opus alone: one tier is enough, or they could never be flagged.
  const single = tally(mk('opus', 'pass', 3))
  assert.ok(single.callouts.some(c => c.kind === 'theoretical-finding' && c.caseId === 'r02'))
})

test('the rendered report carries provenance and the prediction column', () => {
  const md = render(tally([
    { caseId: 'r01', arm: 'baseline', model: 'haiku', verdict: 'pass', predicts: 'fail-on-baseline', isolated: false, hookEvents: 6, resolvedModel: 'claude-haiku-4-5-20251001' },
    { caseId: 'r01', arm: 'A', model: 'haiku', verdict: 'error', predicts: 'fail-on-baseline', isolated: false, hookEvents: 6, resolvedModel: 'claude-haiku-4-5-20251001' },
  ]))
  assert.match(md, /\| case \| predicts \|/, 'controls and predicted-fail cases read in opposite directions')
  assert.match(md, /fail-on-baseline/)
  assert.match(md, /Isolation: contaminated/)
  assert.match(md, /mask bundle B/, 'a contaminated run must never be read as an isolated one')
  assert.match(md, /claude-haiku-4-5-20251001/, 'the resolved snapshot is why the field is recorded')
  assert.match(md, /1 scored `error`/)
})
