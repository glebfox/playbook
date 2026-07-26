import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stage } from './stage.mjs'
import { buildArgs, parseStream, isBroken, composeRoutingPrompt } from './invoke.mjs'

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
  assert.doesNotMatch(p, /^===== ARCHITECTURE\.md =====$/m, 'month-3 does not inject it: constant across arms, and it is r01/r02/r06\'s expected answer')
  cleanup()
})

test('the day-1 prompt delivers the arm-owned ARCHITECTURE.md, and no specs', () => {
  const sha = readFileSync('evals/operating-model/arms/BASELINE_SHA', 'utf8').trim()
  const suite = 'evals/operating-model'

  const a = stage({ suite, arm: 'A', world: 'day-1', baselineSha: sha })
  const pa = composeRoutingPrompt(a.dir, 'Where does this fact belong?')
  assert.match(pa, /^===== ARCHITECTURE\.md =====$/m, 'in day-1 this file is arm-owned, so it must be delivered')
  assert.match(pa, /Status: nothing built yet; the intended stack and layout live in docs\/vision\.md/,
    'edit 1\'s status line is arm A\'s only fixture-side channel in a one-turn run')
  assert.doesNotMatch(pa, /budget\.md =====/, 'day-1 has no specs to include')
  a.cleanup()

  const b = stage({ suite, arm: 'baseline', world: 'day-1', baselineSha: sha })
  const pb = composeRoutingPrompt(b.dir, 'Where does this fact belong?')
  assert.match(pb, /^===== ARCHITECTURE\.md =====$/m)
  assert.doesNotMatch(pb, /Status: nothing built yet; the intended/, 'the baseline sees the empty-file dead end S1 found')
  b.cleanup()
})
