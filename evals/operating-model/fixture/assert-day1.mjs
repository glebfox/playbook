// Asserts the `day-1` world: whitelist-copy from ledger/, then the day-1 overlay on top.
//
// The composition contract stage.mjs must implement, in this order:
//   1. for each path in day-1.whitelist, copy it from ledger/ IF ledger/ has it — `CLAUDE.md` and
//      `docs/operating-model.md` are listed there but are arm-written, so a naive copy loop that
//      assumes every whitelisted path exists in ledger/ will throw on those two;
//   2. copy fixture/day-1/. over the result, replacing `docs/vision.md`, `docs/roadmap.md` and
//      `ARCHITECTURE.md` with their day-1 versions;
//   3. write nothing else. This world is built by whitelist, never by deleting from month-3.
//
// Why the overlay exists: whitelisting alone hands day-1 the month-3 vision ("four increments have
// landed", "balances have reconciled for six weeks") and the month-3 ARCHITECTURE.md, which records
// the whole stack. The first contradicts r05's premise that no code exists; the second disarms r05
// outright, because the fact r05 routes would already be written in the file r05 forbids.
//
// Usage: node assert-day1.mjs [composed-dir]   (with no argument it composes one itself)
import { readFileSync, existsSync, cpSync, mkdirSync, mkdtempSync, readdirSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname, relative } from 'node:path'

const here = new URL('.', import.meta.url).pathname
const LEDGER = join(here, 'ledger')
const OVERLAY = join(here, 'day-1')
const WHITELIST = readFileSync(join(here, 'day-1.whitelist'), 'utf8').split('\n').map(l => l.trim()).filter(Boolean)

// Written by the arm materializer, not by the fixture — listed in the whitelist, absent from ledger/.
const ARM_OWNED = ['CLAUDE.md', 'docs/operating-model.md']

function compose() {
  const dir = mkdtempSync(join(tmpdir(), 'day1-'))
  for (const p of WHITELIST) {
    const src = join(LEDGER, p)
    if (!existsSync(src)) {
      if (!ARM_OWNED.includes(p)) throw new Error(`whitelist names ${p}, which ledger/ does not have and no arm owns`)
      continue
    }
    mkdirSync(join(dir, dirname(p)), { recursive: true })
    cpSync(src, join(dir, p))
  }
  cpSync(OVERLAY, dir, { recursive: true })
  return dir
}

const walk = d => readdirSync(d, { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)])

const root = process.argv[2] ?? compose()
const read = p => existsSync(join(root, p)) ? readFileSync(join(root, p), 'utf8') : null
const nonBlank = s => s.split('\n').filter(l => l.trim()).length

const STACK = /Next\.js|Postgres|Drizzle|Auth\.js|App Router/i
// "Nothing is built" must hold in the prose too: a document claiming shipped work contradicts r05.
const LANDED = /\blanded\b|\breconciled\b|month three|already built|so far|weeks in a row/i

const FACTS = [
  ['docs/vision.md', 'exists', s => s !== null],
  ['docs/vision.md', 'does not name the stack — r05 routes exactly that fact, so it can have no home yet', s => !STACK.test(s)],
  ['docs/vision.md', 'does not name a directory layout either, the other half of r05\'s fact', s => !/domain\//.test(s)],
  ['docs/vision.md', 'claims no shipped work', s => !LANDED.test(s)],
  ['docs/vision.md', 'still splits scope and describes the increments', s => /out of scope/i.test(s) && /^##\s+Increments/m.test(s)],
  ['docs/roadmap.md', 'exists', s => s !== null],
  ['docs/roadmap.md', 'marks nothing done', s => !/\bdone\b/i.test(s)],
  ['docs/roadmap.md', 'carries per-increment status lines and a backlog', s => /todo/i.test(s) && /^##\s+Backlog/m.test(s)],
  ['ARCHITECTURE.md', 'is near-empty — one heading, no placeholder body (bootstrap step 2)', s => nonBlank(s) === 1],
  ['ARCHITECTURE.md', 'names no stack', s => !STACK.test(s)],
  ['ARCHITECTURE.md', 'carries no status line — that line is arm-owned, written by stage() for A and ALL', s => !/^Status:/m.test(s)],
  ['docs/conventions.md', 'exists (month-3 copy: thin, settled conventions only)', s => s !== null],
  ['package.json', 'exists — the lockfile-as-fallback path S1 found is part of the day-1 scenario', s => s !== null],
]

let failed = 0
for (const [file, desc, pred] of FACTS) {
  const s = read(file)
  if (!(s !== null && pred(s))) { failed++; console.error(`FAIL ${file}: ${desc}${s === null ? ' (file missing)' : ''}`) }
}

// Nothing outside the whitelist: month-3 residue here would silently invalidate r05.
const extra = walk(root).map(p => relative(root, p)).filter(p => !WHITELIST.includes(p))
if (extra.length) { failed++; console.error(`FAIL tree: not in the whitelist: ${extra.join(', ')}`) }
for (const d of ['docs/specs', 'docs/guidelines', 'docs/decisions', 'docs/tests', 'docs/increments', 'domain', 'lib', 'db', 'app']) {
  if (existsSync(join(root, d))) { failed++; console.error(`FAIL tree: ${d}/ exists in day-1`) }
}

const total = FACTS.length + 1
console.log(failed === 0 ? `OK day-1 world: ${total} checks, ${walk(root).length} files` : `${failed} day-1 checks failed`)
process.exit(failed === 0 ? 0 : 1)
