import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const dir = process.argv[2]
const wantMarkers = process.argv[3] === '1'
const git = (...a) => execFileSync('git', ['-C', dir, ...a], { encoding: 'utf8' }).trim()

const spec = readFileSync(join(dir, 'docs/specs/domains/transaction.md'), 'utf8')
const marker = spec.match(/^Reconciled:\s*\S+\s*\(([0-9a-f]{7,40})\)/m)

if (!wantMarkers) {
  if (marker) { console.error('FAIL marker present but this arm must not have one'); process.exit(1) }
  const n = git('rev-list', '--count', 'HEAD')
  console.log(`OK no markers, ${n} commits`)
  process.exit(0)
}
if (!marker) { console.error('FAIL no Reconciled marker written'); process.exit(1) }

const drift = git('log', '--oneline', `${marker[1]}..HEAD`, '--', 'domain/transaction')
if (!drift) { console.error(`FAIL no drift: nothing touches domain/transaction after ${marker[1]}`); process.exit(1) }
console.log(`OK marker ${marker[1]}, drift commits:\n${drift}`)
