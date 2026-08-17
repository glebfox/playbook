import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync, existsSync, readdirSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'

const PATCHES = { baseline: [], A: ['01'], B: ['02'], C: ['03'], ALL: ['01', '02', '03'] }
const MARKER_ARMS = new Set(['B', 'ALL'])      // Source:/Reconciled: on specs, Governs: on decisions, inbound links
const STATUS_LINE_ARMS = new Set(['A', 'ALL']) // the day-1 ARCHITECTURE.md status line (edit 1)

export function stage({ suite, arm, world, baselineSha }) {
  const dir = mkdtempSync(join(tmpdir(), `eval-${arm}-`))
  cpSync(join(suite, 'fixture/ledger'), dir, { recursive: true })

  if (world === 'month-3-mid-increment') {
    // month-3 plus one increment still in active/ and its landed code. Additive only.
    cpSync(join(suite, 'fixture/mid-increment'), dir, { recursive: true })
  }

  if (world === 'day-1') {
    const keep = new Set(readFileSync(join(suite, 'fixture/day-1.whitelist'), 'utf8').split('\n').map(s => s.trim()).filter(Boolean))
    const walk = d => readdirSync(join(dir, d), { withFileTypes: true }).flatMap(e => {
      const rel = d ? `${d}/${e.name}` : e.name
      return e.isDirectory() ? walk(rel) : [rel]
    })
    for (const rel of walk('')) if (!keep.has(rel)) rmSync(join(dir, rel))
    // Deleting files leaves empty directories behind, so prune bottom-up.
    const prune = d => {
      for (const e of readdirSync(join(dir, d), { withFileTypes: true }))
        if (e.isDirectory()) prune(d ? `${d}/${e.name}` : e.name)
      if (d && readdirSync(join(dir, d)).length === 0) rmSync(join(dir, d), { recursive: true })
    }
    prune('')
    // The kept files are month-3 documents, and three of them are false on day 1. The overlay
    // replaces vision.md and roadmap.md; without it r05's premise ("no code exists yet") is
    // contradicted by a vision reporting four landed increments.
    cpSync(join(suite, 'fixture/day-1'), dir, { recursive: true })
    // Edit 1's payload IS this line, so it is arm-owned: without it, r05 in arm A
    // measures nothing and the day-1 world is identical across arms. Written after the overlay,
    // which carries the baseline form of this file.
    writeFileSync(join(dir, 'ARCHITECTURE.md'), STATUS_LINE_ARMS.has(arm)
      ? '# Architecture\n\nStatus: nothing built yet; the intended stack and layout live in docs/vision.md\n'
      : '# Architecture\n')
  }

  // The vendored model and the concrete CLAUDE.md are arm-owned. Patch them in a scratch
  // tree first so `git apply` sees the exact paths the patches were generated against.
  const work = mkdtempSync(join(tmpdir(), 'armwork-'))
  writeFileSync(join(work, 'operating-model.md'),
    execFileSync('git', ['show', `${baselineSha}:harness/operating-model.md`], { encoding: 'utf8' }))
  cpSync(join(suite, 'arms/base-claude-md.md'), join(work, 'CLAUDE.md'))
  const armDir = join(process.cwd(), suite, 'arms')
  for (const p of PATCHES[arm]) {
    const file = readdirSync(armDir).find(f => f.startsWith(p) && f.endsWith('.patch'))
    // --unidiff-zero: the patches carry zero context, because the document is one line per
    // paragraph and sibling bundles edit adjacent lines. See the header of any .patch file.
    execFileSync('git', ['apply', '--unidiff-zero', join(armDir, file)], { cwd: work })
  }
  mkdirSync(dirname(join(dir, 'docs/operating-model.md')), { recursive: true })
  cpSync(join(work, 'operating-model.md'), join(dir, 'docs/operating-model.md'))
  cpSync(join(work, 'CLAUDE.md'), join(dir, 'CLAUDE.md'))
  rmSync(work, { recursive: true, force: true })

  if (world === 'day-1') {
    // history.sh replays commits over `lib/`, `domain/transaction/` and the specs — none of which
    // exist in a world whose premise is that no code has been written. Running it here would not
    // just fail under `set -eu`; its `>>` redirections would *create* the very code files day-1
    // must not have. A fresh repo with one commit is the realistic day-1 state.
    const git = (...a) => execFileSync('git', ['-C', dir, ...a], { stdio: 'ignore' })
    git('init', '-q')
    git('config', 'user.email', 'eval@example.invalid')
    git('config', 'user.name', 'Eval Fixture')
    git('config', 'commit.gpgsign', 'false')
    git('add', '-A')
    git('commit', '-q', '-m', 'chore: start the repository with its documentation')
  } else {
    execFileSync('sh', [join(process.cwd(), suite, 'fixture/history.sh'), dir, MARKER_ARMS.has(arm) ? '1' : '0'],
      { stdio: 'ignore' })
  }

  return { dir, cleanup: () => rmSync(dir, { recursive: true, force: true }) }
}

// Checks every arm-owned artifact class in DESIGN.md's table, not just the first one.
// A class that is claimed but never written would otherwise read as "absent everywhere",
// i.e. a vacuous pass — which is exactly how the missing Governs: lines went unnoticed.
const ARTIFACTS = [
  ['docs/specs/domains/transaction.md', /^Reconciled:/m, 'reconcile markers', MARKER_ARMS],
  ['docs/decisions/0004-money-integer-cents.md', /^Governs:/m, 'Governs: line on 0004', MARKER_ARMS],
  ['docs/decisions/0009-import-key.md', /^Governs:/m, 'Governs: line on 0009', MARKER_ARMS],
  ['docs/specs/domains/transaction.md', /see decision 0009/, 'inbound link to 0009', MARKER_ARMS],
]

// The vendored document is arm-owned too, and the artifact rows above cannot see it: in the
// month-3 world arms A and C differ *only* in document body text, so a swapped patch or one that
// silently failed to apply would stage as a valid-looking tree. One representative marker per
// bundle, taken from `arms/all.checklist`, makes that detectable — it is the same class of bug the
// design calls the only one the suite cannot detect from its own output.
const BUNDLE_MARKERS = [
  ['A', /Status: nothing built yet/, 'bundle A (edit 1: the day-one status line)'],
  ['B', /Reconciled: <increment-slug>/, 'bundle B (edit 3: the reconcile-marker prescription)'],
  ['C', /When unsure, leave it in the spec/, 'bundle C (edit 8: the directional default)'],
]
const BUNDLES_IN = { baseline: [], A: ['A'], B: ['B'], C: ['C'], ALL: ['A', 'B', 'C'] }

// Note what is NOT arm-owned: ARCHITECTURE.md's `see decision 0004` pointer exists in every
// arm, because a convention citing its decision is the fixture's realistic month-3 state and
// the operating model's own worked example. Decision 0009 is the uncited one — that absence is
// the amnesia condition edit 4's inbound-link invariant repairs, so its citation is arm-owned.

export function selfCheck(dir, arm, world) {
  const errs = []
  for (const [rel, re, label, arms] of ARTIFACTS) {
    const abs = join(dir, rel)
    if (!existsSync(abs)) continue            // the day-1 world legitimately lacks most of these
    const has = re.test(readFileSync(abs, 'utf8'))
    const wants = arms.has(arm)
    if (has && !wants) errs.push(`arm ${arm} must not carry ${label} (${rel})`)
    if (!has && wants) errs.push(`arm ${arm} must carry ${label} (${rel})`)
  }
  if (!existsSync(join(dir, 'docs/operating-model.md'))) errs.push('vendored operating model missing')
  if (!existsSync(join(dir, 'CLAUDE.md'))) errs.push('CLAUDE.md missing')

  if (existsSync(join(dir, 'docs/operating-model.md'))) {
    const doc = readFileSync(join(dir, 'docs/operating-model.md'), 'utf8')
    const wanted = BUNDLES_IN[arm] ?? []
    for (const [bundle, re, label] of BUNDLE_MARKERS) {
      const has = re.test(doc)
      if (has && !wanted.includes(bundle)) errs.push(`arm ${arm}: the vendored document carries ${label}`)
      if (!has && wanted.includes(bundle)) errs.push(`arm ${arm}: the vendored document is missing ${label}`)
    }
  }

  // The remaining two arm-owned classes. `world` is a parameter because the day-1 status line
  // exists in no other world, and without it this function cannot check the row DESIGN claims
  // it checks.
  const claude = existsSync(join(dir, 'CLAUDE.md')) ? readFileSync(join(dir, 'CLAUDE.md'), 'utf8') : ''
  if (/## Reading order/.test(claude) !== MARKER_ARMS.has(arm))
    errs.push(`arm ${arm}: the concrete CLAUDE.md carries the reading order iff the arm is B or ALL`)
  if (world === 'day-1') {
    const arch = readFileSync(join(dir, 'ARCHITECTURE.md'), 'utf8')
    if (/^Status: nothing built yet/m.test(arch) !== STATUS_LINE_ARMS.has(arm))
      errs.push(`arm ${arm}: the day-1 status line is present iff the arm is A or ALL`)
  }
  return errs
}
