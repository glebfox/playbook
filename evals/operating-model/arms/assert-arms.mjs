import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const ARMS = { baseline: [], A: ['01'], B: ['02'], C: ['03'], ALL: ['01', '02', '03'] }
const sha = readFileSync('evals/operating-model/arms/BASELINE_SHA', 'utf8').trim()
const base = execFileSync('git', ['show', `${sha}:harness/operating-model.md`], { encoding: 'utf8' })
const baseClaude = readFileSync('evals/operating-model/arms/base-claude-md.md', 'utf8')

// Markers proving each edit is present, checked against the ALL arm.
const CHECKLIST = readFileSync('evals/operating-model/arms/all.checklist', 'utf8')
  .split('\n').filter(l => l.includes('\t')).map(l => { const [id, ...re] = l.split('\t'); return [id, new RegExp(re.join('\t'), 'm')] })

// The `m` flag is load-bearing: row 5a is `^`-anchored and would never match mid-file without it.
// The count assertion guards against a copy that lost its literal tabs, which would silently
// produce an empty checklist and a vacuous pass.
if (CHECKLIST.length !== 10) { console.error(`FAIL checklist has ${CHECKLIST.length} rows, expected 10 — tabs mangled?`); process.exit(1) }

let failed = 0
for (const [arm, patches] of Object.entries(ARMS)) {
  const dir = mkdtempSync(join(tmpdir(), 'arm-'))
  writeFileSync(join(dir, 'operating-model.md'), base)
  writeFileSync(join(dir, 'CLAUDE.md'), baseClaude)
  for (const p of patches) {
    const file = execFileSync('ls', ['evals/operating-model/arms'], { encoding: 'utf8' })
      .split('\n').find(f => f.startsWith(p))
    try {
      // --unidiff-zero: the patches carry zero context on purpose. The document is one line per
      // paragraph and bundle C's edit 9 sits directly above bundle A's move-not-copy edit, so any
      // surrounding context makes A -> B -> C composition fail on lines a sibling bundle rewrote.
      // Safety is unaffected: git apply still requires each removed line to match exactly.
      execFileSync('git', ['apply', '--verbose', '--unidiff-zero', join(process.cwd(), 'evals/operating-model/arms', file)], { cwd: dir })
    } catch (e) { failed++; console.error(`FAIL ${arm}: patch ${file} did not apply\n${e.stderr}`); }
  }
  if (arm === 'ALL') {
    const all = readFileSync(join(dir, 'operating-model.md'), 'utf8') + '\n' + readFileSync(join(dir, 'CLAUDE.md'), 'utf8')
    for (const [id, re] of CHECKLIST) {
      if (!re.test(all)) { failed++; console.error(`FAIL ALL: edit ${id} not present (/${re.source}/)`) }
    }
  }
  console.log(`${arm}: applied ${patches.length} patch(es)`)
}
console.log(failed === 0 ? 'OK all arms materialize' : `${failed} failures`)
process.exit(failed === 0 ? 0 : 1)
