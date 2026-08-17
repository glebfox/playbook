import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const root = process.argv[2] ?? new URL('./ledger/', import.meta.url).pathname
const read = p => existsSync(join(root, p)) ? readFileSync(join(root, p), 'utf8') : null

// Bullets inside one `## Section`, stopping at the next heading.
const countBullets = (s, heading) => {
  const body = s.split(new RegExp(`^##\\s+${heading}\\s*$`, 'm'))[1]?.split(/^##\s/m)[0] ?? ''
  return (body.match(/^-\s/gm) ?? []).length
}

// Two classes of entry, both load-bearing:
//   PRESENT — the fixture must state this, because a case's expected destination depends on it
//             existing, or on the file being the plausible home.
//   ABSENT  — the fixture must NOT state this, because a routing case routes it. If the fact is
//             already in the tree there is nothing to route and the case silently measures
//             compliance with an existing file instead of a routing decision. This class is the
//             one that goes stale as the fixture is edited, so it is checked mechanically.
const FACTS = [
  // --- PRESENT ---
  ['ARCHITECTURE.md', 'integer-cents convention cites decision 0004', s => /integer cents/i.test(s) && /decision 0004/.test(s)],
  ['ARCHITECTURE.md', 'layout block names app/, domain/, lib/, db/', s => ['app/', 'domain/', 'lib/', 'db/'].every(d => s.includes(d))],
  ['ARCHITECTURE.md', 'has the command block b04 consolidates into', s => /^##\s+Build \/ run \/ test/m.test(s)],
  ['ARCHITECTURE.md', 'has a conventions block', s => /^##\s+Architectural conventions/m.test(s)],
  // The backtick is tolerated deliberately: the vendored line is a markdown code span,
  // `domain/` may not import…, so a regex without it is unsatisfiable by realistic prose.
  ['ARCHITECTURE.md', 'domain/ isolation stated without naming a services/ that does not exist', s => /domain\/`? may not import/.test(s) && !/services\//.test(s)],
  ['ARCHITECTURE.md', 'errors cross the domain boundary as a result union', s => /result union/.test(s)],
  ['docs/conventions.md', 'states some commit message format, so it is the plausible home for r11', s => /commit/i.test(s)],
  ['docs/guidelines/nextjs-runtime.md', 'states the node-vs-edge constraint (b02 must be able to find it)', s => /edge/i.test(s) && /node/i.test(s)],
  ['docs/decisions/0004-money-integer-cents.md', 'records the rejected NUMERIC alternative', s => /NUMERIC/.test(s) && /decimal/i.test(s)],
  ['docs/decisions/0009-import-key.md', 'records the partial unique index', s => /partial unique index/i.test(s)],
  // Counted per section, not across the file: the spec's `## Shape` table alone matches
  // /^[-*|]/ two dozen times, so a whole-file count passes on a spec with no invariants at all.
  ['docs/specs/domains/transaction.md', '7 behaviors under ## Behavior', s => countBullets(s, 'Behavior') >= 7],
  ['docs/specs/domains/transaction.md', '3 invariants under ## Invariants', s => countBullets(s, 'Invariants') >= 3],
  ['docs/specs/domains/transaction.md', 'Extension points name domain/transaction/rules.ts', s => /rules\.ts/.test(s)],
  ['docs/specs/domains/budget.md', 'zero is a legitimate limit', s => /zero/i.test(s) && /limit/i.test(s)],
  ['docs/specs/domains/budget.md', 'a budget may start in the future (r04 contagion landing site)', s => /future/i.test(s)],
  ['docs/tests/domains/transaction.md', 'has explicit gap rows', s => /not verified|not tested/i.test(s)],
  ['docs/tests/domains/transaction.md', 'points at the testing guideline', s => /guidelines\/testing/.test(s)],
  ['lib/money.ts', 'formatMoney signature present', s => /formatMoney/.test(s)],
  ['domain/transaction/rules.ts', 'rejectZeroAmount guard present', s => /rejectZeroAmount/.test(s)],

  // --- ABSENT: one row per routing case, so a fixture edit cannot silently disarm a case ---
  ['ARCHITECTURE.md', 'r01: no rounding statement', s => !/round/i.test(s)],
  ['ARCHITECTURE.md', 'r02: no Server Actions statement', s => !/server action/i.test(s)],
  ['docs/guidelines/nextjs-runtime.md', 'r03: no fetch-caching mechanic', s => !/no-store/i.test(s) && !/fetch.*cach/i.test(s)],
  ['docs/specs/domains/transaction.md', 'r04: no future-dating rule', s => !/future/i.test(s)],
  ['docs/vision.md', 'r05: does not name the stack — by month 3 it has migrated to ARCHITECTURE.md', s => !/Next\.js/i.test(s) && !/Postgres/i.test(s)],
  ['ARCHITECTURE.md', 'r06: no repository layer', s => !/repositor/i.test(s)],
  ['docs/specs/domains/transaction.md', 'r07: importKey uniqueness not yet stated in the spec', s => !(/importKey/.test(s) && /unique/i.test(s))],
  ['docs/vision.md', 'r08: no multi-currency', s => !/multi-currenc/i.test(s)],
  ['docs/roadmap.md', 'r08: no multi-currency', s => !/multi-currenc/i.test(s)],
  ['docs/conventions.md', 'r11: no imperative-mood or 60-character rule', s => !/imperative/i.test(s) && !/60/.test(s)],
  ['docs/specs/domains/transaction.md', 'r12: no import-batch reference', s => !/batch/i.test(s)],
  ['docs/tests/domains/transaction.md', 'r10: no re-categorization row', s => !/re-categoriz/i.test(s)],
  ['docs/tests/domains/transaction.md', 'no coverage row for a behavior the spec no longer states', s => !/future/i.test(s) && !/importKey/.test(s)],
  ['docs/tests/domains/transaction.md', '12 coverage rows', s => (s.match(/^\|/gm) ?? []).length >= 14],
  ['docs/specs/domains/transaction.md', 'no reconcile headers — those are arm-owned, written by history.sh', s => !/^Reconciled:/m.test(s) && !/^Source:/m.test(s)],
  ['docs/decisions/0009-import-key.md', 'no Governs: line — arm-owned', s => !/^Governs:/m.test(s)],
]

// r09's absence is a whole-tree property rather than a single file: no decision may already
// record the Drizzle-vs-Prisma rationale.
// `withFileTypes` + isFile matters: a `drafts/` subdirectory would make readFileSync throw and
// kill the whole assertion with a stack trace instead of printing a FAIL line.
const mdFiles = dir => readdirSync(dir, { withFileTypes: true }).filter(e => e.isFile() && e.name.endsWith('.md')).map(e => e.name)

const TREE_FACTS = [
  ['docs/decisions', 'r09: no Prisma rationale anywhere in the decision log', dir =>
    !mdFiles(dir).some(f => /prisma/i.test(readFileSync(join(dir, f), 'utf8')))],
  ['docs/decisions', 'the log is contiguous 0001-0009 — a missing number is a dangling citation', dir => {
    const ns = mdFiles(dir).map(f => Number(f.slice(0, 4))).sort((a, b) => a - b)
    return ns.length === 9 && ns.every((n, i) => n === i + 1)
  }],
  ['docs/decisions', '0009 is cited by nothing in the arm-independent fixture', dir => {
    const others = ['ARCHITECTURE.md', 'docs/specs/domains/transaction.md', 'docs/specs/domains/budget.md',
      'docs/tests/domains/transaction.md', 'docs/vision.md', 'docs/roadmap.md']
    return !others.some(p => /decision 0009/.test(read(p) ?? ''))
  }],
]

let failed = 0
for (const [file, desc, pred] of FACTS) {
  const s = read(file)
  const ok = s !== null && pred(s)
  if (!ok) { failed++; console.error(`FAIL ${file}: ${desc}${s === null ? ' (file missing)' : ''}`) }
}
for (const [rel, desc, pred] of TREE_FACTS) {
  const dir = join(root, rel)
  const ok = existsSync(dir) && pred(dir)
  if (!ok) { failed++; console.error(`FAIL ${rel}: ${desc}`) }
}
const total = FACTS.length + TREE_FACTS.length
console.log(failed === 0 ? `OK ${total} facts` : `${failed}/${total} facts failed`)
process.exit(failed === 0 ? 0 : 1)
