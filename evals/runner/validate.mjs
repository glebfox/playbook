import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseCase, validateCase, armsFor } from './schema.mjs'

const suite = process.argv[2]
if (!suite) { console.error('usage: node validate.mjs <suite-dir>'); process.exit(2) }

let bad = 0, combos = 0
const seen = new Set()
for (const fam of ['routing', 'behavioral']) {
  const dir = join(suite, 'cases', fam)
  for (const f of readdirSync(dir).filter(f => f.endsWith('.md')).sort()) {
    const c = parseCase(readFileSync(join(dir, f), 'utf8'))
    const errs = validateCase(c)
    if (c.family !== fam) errs.push(`family ${c.family} does not match directory ${fam}`)
    if (seen.has(c.id)) errs.push(`duplicate id ${c.id}`)
    seen.add(c.id)
    combos += armsFor(c).length
    if (errs.length) { bad++; console.error(`FAIL ${f}\n  ${errs.join('\n  ')}`) }
  }
}
console.log(`${seen.size} cases, ${combos} case-arm combinations, ${bad} invalid`)
process.exit(bad === 0 ? 0 : 1)
