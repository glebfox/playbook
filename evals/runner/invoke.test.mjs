import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stage } from './stage.mjs'
import { buildArgs, parseStream, isBroken, composeRoutingPrompt, composeBehavioralPrompt } from './invoke.mjs'

const SCHEMA = '{"type":"object","properties":{"destination":{"type":"string"}},"required":["destination"]}'

test('routing args carry verbose, json schema, a budget cap, and safe-mode isolation', () => {
  const a = buildArgs({ model: 'haiku', family: 'routing', caps: { budgetUsd: 0.5 }, jsonSchema: SCHEMA, isolated: true })
  assert.ok(a.includes('--verbose'), 'stream-json requires --verbose')
  assert.ok(a.includes('--output-format') && a.includes('stream-json'))
  assert.ok(a.includes('--json-schema'))
  assert.ok(a.includes('--max-budget-usd'))
  // Isolation for routing comes from --safe-mode, which is verified to keep subscription auth,
  // rather than from --setting-sources project, which drops the credentials with the hooks.
  assert.ok(a.includes('--safe-mode'))
  assert.ok(!a.includes('--setting-sources'), 'no API key should be needed to isolate a routing run')
  // --allowedTools '' only withholds pre-approval; a read-only tool needs none. Opus was observed
  // reading ARCHITECTURE.md out of the staged tree with it set, so the deny list is what blocks.
  assert.ok(a.includes('--disallowedTools'))
  // A wildcard, not a name list: the list version named fourteen tools and Opus escaped through
  // ToolSearch, which loads the rest on demand. Enumerating tools is a race against the toolset.
  assert.equal(a[a.indexOf('--disallowedTools') + 1], '*')
})

test('behavioral args allow tools, omit the json schema, and isolate without a key', () => {
  const a = buildArgs({ model: 'opus', family: 'behavioral', caps: { budgetUsd: 3 }, isolated: true })
  assert.ok(!a.includes('--json-schema'))
  assert.ok(a.includes('--permission-mode'), 'the agent must be able to write')
  // safe-mode costs auto-discovery of CLAUDE.md, which composeBehavioralPrompt hands over instead.
  // It buys zero hooks on subscription auth — no API key anywhere in this suite.
  assert.ok(a.includes('--safe-mode'))
  assert.ok(!a.includes('--setting-sources'))
  // The realistic-but-contaminated condition stays available, deliberately opt-in.
  assert.ok(!buildArgs({ model: 'opus', family: 'behavioral', caps: { budgetUsd: 3 }, isolated: false }).includes('--safe-mode'))
})

test('the behavioral prompt hands over the arm-owned map, and can be told not to', () => {
  const sha = readFileSync('evals/operating-model/arms/BASELINE_SHA', 'utf8').trim()
  const suite = 'evals/operating-model'

  const b = stage({ suite, arm: 'B', world: 'month-3', baselineSha: sha })
  const withMap = composeBehavioralPrompt(b.dir, 'Add a rule to the transaction domain.')
  assert.match(withMap, /## Reading order/, "arm B's edit reaches the model even though safe-mode suppresses discovery")
  assert.ok(withMap.lastIndexOf('Add a rule to the transaction domain.') > withMap.indexOf('CLAUDE.md'), 'the task comes last')
  assert.equal(composeBehavioralPrompt(b.dir, 'T', { injectMap: false }), 'T', 'contaminated mode discovers it normally')

  // The baseline map must not carry B's section, or the arm difference would be delivered to both.
  const base = stage({ suite, arm: 'baseline', world: 'month-3', baselineSha: sha })
  assert.doesNotMatch(composeBehavioralPrompt(base.dir, 'T'), /## Reading order/)
  b.cleanup(); base.cleanup()
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

test('isBroken catches the auth-failure shape as the CLI actually emits it', () => {
  // Trimmed from a real nested invocation: three SessionStart hook events, an init carrying the
  // resolved model and apiKeySource "none", an assistant event flagged authentication_failed, and a
  // result that is `subtype: "success"` AND `is_error: true` at once.
  const stream = [
    '{"type":"system","subtype":"hook_response","hook_name":"SessionStart:startup","outcome":"success"}',
    '{"type":"system","subtype":"hook_response","hook_name":"SessionStart:startup","outcome":"success"}',
    '{"type":"system","subtype":"init","model":"claude-haiku-4-5-20251001","apiKeySource":"none"}',
    '{"type":"assistant","message":{"content":[{"type":"text","text":"Not logged in · Please run /login"}]},"error":"authentication_failed"}',
    '{"type":"result","subtype":"success","is_error":true,"num_turns":1,"total_cost_usd":0}',
  ].join('\n')
  const p = parseStream(stream)
  assert.equal(p.model, 'claude-haiku-4-5-20251001', 'the init event carries the resolved snapshot')
  assert.equal(p.apiKeySource, 'none')
  assert.equal(p.hookEvents, 2, 'host hooks fire inside nested runs')
  assert.match(isBroken(p), /auth/i)
  assert.match(isBroken(p), /authentication_failed/, 'the event flag is preferred over the message text')
})

test('is_error alone is enough, even when the body looks like an answer', () => {
  const stream = [
    '{"type":"system","subtype":"init"}',
    '{"type":"assistant","message":{"content":[{"type":"text","text":"{\\"destination\\":\\"ARCHITECTURE.md\\"}"}]}}',
    '{"type":"result","subtype":"success","is_error":true,"num_turns":2,"total_cost_usd":0.01}',
  ].join('\n')
  assert.match(isBroken(parseStream(stream)), /is_error/)
})

test('isBroken passes a real run', () => {
  const stream = [
    '{"type":"system","subtype":"init"}',
    '{"type":"assistant","message":{"content":[{"type":"text","text":"{\\"destination\\":\\"ARCHITECTURE.md\\"}"}]}}',
    '{"type":"result","subtype":"success","num_turns":2,"total_cost_usd":0.01}',
  ].join('\n')
  assert.equal(isBroken(parseStream(stream)), null)
})

test('routing prompt carries the map, the tree and the specs — but not the full document', () => {
  const sha = readFileSync('evals/operating-model/arms/BASELINE_SHA', 'utf8').trim()
  const { dir, cleanup } = stage({ suite: 'evals/operating-model', arm: 'C', world: 'month-3', baselineSha: sha })
  const p = composeRoutingPrompt(dir, 'Where does this fact belong?')
  assert.match(p, /# Ledger/, 'the concrete CLAUDE.md is included')
  // Injecting the full model produced a 100% baseline ceiling across 68 runs: a session holding the
  // whole rulebook routes correctly regardless of the edits, which is not the condition under test.
  assert.doesNotMatch(p, /Operating Model: Repository as System of Record/, 'the full document must NOT be injected')
  assert.match(p, /docs\/operating-model\.md/, 'it is still visible in the tree, as a real session would see it')
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
