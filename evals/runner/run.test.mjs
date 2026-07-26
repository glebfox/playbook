// Drives run.mjs end to end against the stub in testdata/, so the plumbing is verified without
// auth or tokens. This is the token-free counterpart to Task 8 step 2's smoke run — that step still
// has to happen against the real CLI, because only it can tell us whether the CLI behaves as assumed.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync, existsSync, rmSync, mkdtempSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const SUITE = 'evals/operating-model'

// PATH resolution needs a file named exactly `claude`, so the stub is exposed under that name in a
// temp bin directory rather than committed as a file called `claude` in the repository. Without
// this the tests silently exercise the real CLI: it fails auth, run.mjs aborts, and the failure
// looks like a bug in the driver.
const STUB = mkdtempSync(join(tmpdir(), 'fakebin-'))
symlinkSync(resolve('evals/runner/testdata/fake-claude'), join(STUB, 'claude'))

function drive(runId, { env = {}, args = [], expectExit = 0 } = {}) {
  const out = join(SUITE, 'results', runId)
  let status = 0, stdout = '', stderr = ''
  try {
    stdout = execFileSync('node', ['evals/runner/run.mjs', '--suite', SUITE, '--run-id', runId, ...args], {
      encoding: 'utf8',
      env: { ...process.env, PATH: `${STUB}:${process.env.PATH}`, ...env },
    })
  } catch (e) {
    status = e.status ?? 1
    stdout = e.stdout ?? ''
    stderr = e.stderr ?? ''
  }
  assert.equal(status, expectExit, `run.mjs exit ${status}, expected ${expectExit}\n${stderr}`)
  const ledgerPath = join(out, 'runs.jsonl')
  const records = existsSync(ledgerPath)
    ? readFileSync(ledgerPath, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l))
    : []
  return { out, stdout, stderr, records }
}

const cleanup = id => rmSync(join(SUITE, 'results', id), { recursive: true, force: true })

test('a routing case runs across its arms and lands in the ledger', () => {
  const id = 'test-stub-routing-pass'
  cleanup(id)
  const { out, records } = drive(id, { env: { FAKE_MODE: 'routing', FAKE_DEST: 'ARCHITECTURE.md' }, args: ['--case', 'r01', '--reps', '1'] })

  // r01 targets [A]: baseline, A, ALL — on both tiers, one rep each.
  assert.equal(records.length, 6)
  assert.deepEqual([...new Set(records.map(r => r.arm))].sort(), ['A', 'ALL', 'baseline'])
  assert.deepEqual([...new Set(records.map(r => r.model))].sort(), ['haiku', 'opus'])
  for (const r of records) {
    assert.equal(r.verdict, 'pass', `${r.arm}/${r.model}: ${r.reason}`)
    assert.equal(r.resolvedModel, 'claude-fake-1', 'the resolved model id is recorded per run')
    assert.equal(r.costUsd, 0.01)
    assert.equal(r.hookEvents, 0)
    assert.equal(r.predicts, 'fail-on-baseline')
    assert.ok(existsSync(join(out, r.streamFile)), `stream file kept: ${r.streamFile}`)
  }
  cleanup(id)
})

test('a forbidden destination grades fail, and the reason says which', () => {
  const id = 'test-stub-routing-fail'
  cleanup(id)
  const { records } = drive(id, { env: { FAKE_MODE: 'routing', FAKE_DEST: 'docs/specs/domains/transaction.md' }, args: ['--case', 'r01', '--reps', '1'] })
  assert.equal(records.length, 6)
  for (const r of records) {
    assert.equal(r.verdict, 'fail')
    assert.match(r.reason, /forbidden destination docs\/specs\/domains\/transaction\.md/)
  }
  cleanup(id)
})

test('an auth failure aborts on the first run instead of burning the matrix', () => {
  const id = 'test-stub-auth'
  cleanup(id)
  const { records, stderr } = drive(id, { env: { FAKE_MODE: 'auth' }, args: ['--reps', '1'], expectExit: 1 })
  assert.equal(records.length, 1, 'exactly one invocation is spent before the abort')
  assert.equal(records[0].verdict, 'error')
  assert.match(stderr, /ABORT after an auth failure/)
  assert.match(stderr, /verify-cli\.sh/, 'the abort points at the fix')
  cleanup(id)
})

test('a behavioral case grades from the tool log, with absolute paths stripped', () => {
  const id = 'test-stub-behavioral'
  cleanup(id)
  // `$CWD/` makes the stub report an absolute path, as the real CLI does. b04's predicate is
  // saw(Write|Edit:ARCHITECTURE.md), so this passes only if invoke() strips the staging prefix —
  // and on macOS the staged dir and the child's cwd differ by the /var -> /private/var symlink,
  // which is exactly the case a single-prefix strip would miss.
  const env = { FAKE_MODE: 'behavioral', FAKE_TOOLS: JSON.stringify([{ name: 'Edit', input: { file_path: '$CWD/ARCHITECTURE.md' } }]) }
  const first = drive(id, { env, args: ['--case', 'b04', '--reps', '1'] })
  assert.equal(first.records.length, 3, 'b04 targets [A]: baseline, A, ALL — Opus only')
  for (const r of first.records) assert.equal(r.verdict, 'pass', `${r.arm}: ${r.reason}`)

  // --resume must not re-spend what the ledger already has.
  const second = drive(id, { env, args: ['--case', 'b04', '--reps', '1', '--resume'] })
  assert.match(second.stdout, /3 run\(s\) already in/)
  assert.match(second.stdout, /3 skipped as already done/)
  assert.equal(second.records.length, 3, 'no duplicate rows appended')
  cleanup(id)
})
