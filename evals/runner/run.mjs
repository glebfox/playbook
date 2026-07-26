import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync, writeFileSync, mkdirSync, appendFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { parseCase, validateCase, armsFor } from './schema.mjs'
import { stage, selfCheck } from './stage.mjs'
import { invoke, composeRoutingPrompt } from './invoke.mjs'
import { grade } from './grade.mjs'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const has = k => process.argv.includes(k)

const suite = arg('--suite', 'evals/operating-model')
const runId = arg('--run-id')
const repsOverride = arg('--reps') ? Number(arg('--reps')) : null
const only = arg('--case')
if (!runId) { console.error('--run-id is required (e.g. calibration-1, full-1)'); process.exit(2) }

// Isolation now differs by family, because the CLI's verified behavior differs:
//   routing    — `--safe-mode`: zero hooks, subscription auth intact. Always isolated, no key.
//   behavioral — needs the fixture's CLAUDE.md discovered, so safe-mode is out. `--setting-sources
//                project` suppresses hooks but drops subscription credentials, so full isolation
//                there requires ANTHROPIC_API_KEY. Without one, host hooks fire in those 36 runs.
const hasApiKey = Boolean(process.env.ANTHROPIC_API_KEY)
const allowContaminated = has('--allow-contaminated')
const isolationOf = family => family === 'routing' ? 'safe-mode' : (hasApiKey ? 'setting-sources' : 'host-settings')
if (!hasApiKey && allowContaminated) console.warn('WARNING: behavioral runs will load host settings. Hooks fire in every one of them; the contamination is arm-invariant but the skills gate can mask bundle B.')

// Preflight: without this a missing or broken CLI produces a full run of `error` verdicts that
// looks like data. One cheap call up front turns that into one clear line before anything stages.
try {
  execFileSync('claude', ['--version'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
} catch (e) {
  console.error(`the \`claude\` CLI is not runnable here: ${e.message.split('\n')[0]}`)
  process.exit(2)
}

const SCHEMA = JSON.stringify({ type: 'object', properties: { destination: { type: 'string' } }, required: ['destination'], additionalProperties: false })
const baselineSha = readFileSync(join(suite, 'arms/BASELINE_SHA'), 'utf8').trim()
const outDir = join(suite, 'results', runId)
mkdirSync(join(outDir, 'streams'), { recursive: true })
const ledger = join(outDir, 'runs.jsonl')

// --resume: skip combinations this run-id has already recorded. The full run is 546 invocations,
// most of the cost in the behavioral layer, so a crash at run 500 must not mean re-spending all of
// it. Off by default, so the plan's behavior is unchanged unless asked for.
const alreadyDone = new Set()
if (has('--resume') && existsSync(ledger)) {
  for (const line of readFileSync(ledger, 'utf8').split('\n')) {
    if (!line.trim()) continue
    try { const r = JSON.parse(line); alreadyDone.add(`${r.caseId}|${r.arm}|${r.model}|${r.rep}`) } catch { /* truncated final line */ }
  }
  console.log(`resuming: ${alreadyDone.size} run(s) already in ${ledger}`)
}

const cases = []
for (const fam of ['routing', 'behavioral']) {
  for (const f of readdirSync(join(suite, 'cases', fam)).filter(f => f.endsWith('.md')).sort()) {
    const casePath = join('cases', fam, f)
    const c = parseCase(readFileSync(join(suite, casePath), 'utf8'))
    const errs = validateCase(c)
    if (errs.length) { console.error(`invalid case ${f}: ${errs.join('; ')}`); process.exit(2) }
    if (!only || c.id.startsWith(only)) cases.push({ ...c, casePath })
  }
}

let done = 0, skipped = 0
for (const c of cases) {
  for (const arm of armsFor(c)) {
    for (const [model, reps] of Object.entries(c.reps)) {
      for (let rep = 1; rep <= (repsOverride ?? reps); rep++) {
        if (alreadyDone.has(`${c.id}|${arm}|${model}|${rep}`)) { skipped++; continue }
        const isolation = isolationOf(c.family)
        // Refuse to run a contaminated behavioral case by accident: those are the cases that
        // measure reading behavior, and the skills-gate hook perturbs exactly that.
        if (isolation === 'host-settings' && !allowContaminated) {
          console.error(`REFUSING to run behavioral case ${c.id} with host settings loaded — hooks would fire inside it and can mask bundle B.\nEither export ANTHROPIC_API_KEY for real isolation, or pass --allow-contaminated to accept it knowingly.\nRouting cases need neither: they isolate via --safe-mode.`)
          process.exit(2)
        }
        const { dir, cleanup } = stage({ suite, arm, world: c.world, baselineSha })
        const bad = selfCheck(dir, arm, c.world)
        if (bad.length) { cleanup(); console.error(`ABORT materialization self-check failed for ${arm}: ${bad.join('; ')}`); process.exit(1) }
        // Routing: one turn, no tools, so the context is assembled into the prompt.
        // Behavioral: the agent explores the staged tree itself.
        const prompt = c.family === 'routing' ? composeRoutingPrompt(dir, c.prompt, c.world) : c.prompt
        const p = await invoke({ dir, prompt, model, family: c.family, caps: c.caps,
          jsonSchema: c.family === 'routing' ? SCHEMA : null, isolated: isolation === 'setting-sources' })
        const { verdict, reason } = grade(p, c)
        const streamFile = `streams/${c.id}-${arm}-${model}-${rep}.txt`
        writeFileSync(join(outDir, streamFile), p.events.map(e => JSON.stringify(e)).join('\n'))
        appendFileSync(ledger, JSON.stringify({ caseId: c.id, casePath: c.casePath, arm, model, rep,
          predicts: c.predicts, verdict, reason, streamFile, resolvedModel: p.model,
          hookEvents: p.hookEvents, costUsd: p.result?.total_cost_usd ?? null, isolationMode: isolation }) + '\n')
        cleanup()
        done++
        console.log(`[${done}] ${c.id} ${arm} ${model} #${rep} → ${verdict} (${reason})`)
        // An auth failure is never a legitimate verdict, and it does not heal on the next run.
        // Stopping on the first one is the difference between one wasted invocation and 546.
        if (verdict === 'error' && /auth|not logged in/i.test(reason)) {
          console.error(`\nABORT after an auth failure — no measurement is possible until it is fixed.\nSee Task 6 step 5: run \`sh evals/runner/verify-cli.sh\` from a normal terminal.`)
          process.exit(1)
        }
      }
    }
  }
}
console.log(`\n${done} runs${skipped ? `, ${skipped} skipped as already done` : ''} → ${ledger}`)
