const BUNDLES = { A: 'A', B: 'B', C: 'C' }

export function tally(records) {
  const byTier = {}
  // Run provenance travels with the numbers, because two facts change how they must be read and
  // neither is visible in a pass rate: whether host settings were loaded (hooks then fire in every
  // run, and the skills gate can mask bundle B), and which model snapshots actually answered.
  const prov = { isolation: new Set(), hookEvents: 0, resolvedModels: {}, errors: 0, runs: 0 }
  for (const r of records) {
    const t = (byTier[r.model] ??= {})
    const c = (t[r.caseId] ??= {})
    const a = (c[r.arm] ??= { pass: 0, n: 0, errors: 0, predicts: r.predicts })
    if (r.verdict === 'error') a.errors++
    else { a.n++; if (r.verdict === 'pass') a.pass++ }
    a.predicts ??= r.predicts

    prov.runs++
    if (r.verdict === 'error') prov.errors++
    // `isolationMode` names the mechanism per run (routing and behavioral differ); the older
    // boolean is still read so a ledger from before that split still renders.
    if (r.isolationMode) prov.isolation.add(r.isolationMode)
    else if (r.isolated !== undefined) prov.isolation.add(r.isolated ? 'isolated' : 'contaminated')
    prov.hookEvents += r.hookEvents ?? 0
    if (r.resolvedModel) (prov.resolvedModels[r.model] ??= new Set()).add(r.resolvedModel)
  }
  for (const t of Object.values(byTier)) for (const c of Object.values(t)) for (const a of Object.values(c)) a.rate = a.n ? a.pass / a.n : null

  const callouts = []
  for (const [tier, cases] of Object.entries(byTier)) {
    for (const [caseId, arms] of Object.entries(cases)) {
      const base = arms.baseline
      if (!base || base.rate === null) continue
      const predicts = base.predicts ?? Object.values(arms).find(a => a.predicts)?.predicts
      for (const [arm, a] of Object.entries(arms)) {
        if (arm === 'baseline' || a.rate === null) continue
        // Compare RATES, not pass counts. Errors shrink denominators, so counts are not
        // comparable: 5/5 against a baseline 10/10 would fire a false regression, while a real
        // 5/5 → 3/10 collapse would hide. "More than two reps" is expressed against the
        // surviving denominator.
        if (predicts === 'control' && base.rate - a.rate > 2 / Math.max(base.n, a.n))
          callouts.push({ kind: 'control-regression', tier, caseId, arm, from: base.rate, to: a.rate })
      }
      if (predicts === 'fail-on-baseline' && base.rate >= 0.8) {
        // Every tier that RUNS the case must agree — not "more than one tier". Behavioral cases
        // are Opus-only, so requiring two tiers would make them unflaggable forever.
        const tiers = Object.entries(byTier).filter(([, cs]) => cs[caseId]?.baseline?.rate != null)
        if (tiers.length >= 1 && tiers.every(([, cs]) => cs[caseId].baseline.rate >= 0.8) && !callouts.some(c => c.kind === 'theoretical-finding' && c.caseId === caseId))
          callouts.push({ kind: 'theoretical-finding', caseId, rates: Object.fromEntries(tiers.map(([m, cs]) => [m, cs[caseId].baseline.rate])) })
      }
    }
  }

  // Headline deltas are computed over predicted-fail cases only. Controls are flat by
  // construction, so including them dilutes every bundle toward zero — one working edit plus
  // one flat control reports 0.5 for an edit that worked perfectly. Controls have their own
  // call-out; they are not part of the effect size.
  const bundleDeltas = {}
  for (const [tier, cases] of Object.entries(byTier)) {
    bundleDeltas[tier] = {}
    for (const arm of [...Object.keys(BUNDLES), 'ALL']) {
      const ds = Object.values(cases)
        .filter(c => c[arm]?.rate != null && c.baseline?.rate != null
          && (c.baseline.predicts ?? Object.values(c).find(a => a.predicts)?.predicts) === 'fail-on-baseline')
        .map(c => c[arm].rate - c.baseline.rate)
      bundleDeltas[tier][arm] = ds.length ? ds.reduce((a, b) => a + b, 0) / ds.length : null
    }
  }
  const provenance = {
    ...prov,
    isolation: [...prov.isolation].sort(),
    resolvedModels: Object.fromEntries(Object.entries(prov.resolvedModels).map(([k, v]) => [k, [...v].sort()])),
  }
  return { byTier, bundleDeltas, callouts, provenance }
}

export function render(t) {
  const pct = v => v === null ? '—' : `${Math.round(v * 100)}%`
  const out = []
  for (const [tier, cases] of Object.entries(t.byTier)) {
    out.push(`## ${tier}\n`)
    const arms = ['baseline', 'A', 'B', 'C', 'ALL']
    // The prediction column is not decoration: a control and a predicted-fail case are read in
    // opposite directions, and r06's baseline column in particular is *compliance with the old
    // rule* rather than an error. A table without it invites exactly that misreading.
    out.push(`| case | predicts | ${arms.join(' | ')} |`, `|---|---|${arms.map(() => '---').join('|')}|`)
    for (const [caseId, a] of Object.entries(cases).sort()) {
      const predicts = Object.values(a).find(x => x.predicts)?.predicts ?? '?'
      out.push(`| ${caseId} | ${predicts} | ` + arms.map(arm => {
        const x = a[arm]
        if (!x || x.rate === null) return '—'
        const d = arm === 'baseline' || !a.baseline || a.baseline.rate === null ? '' : ` (${x.rate - a.baseline.rate >= 0 ? '+' : ''}${Math.round((x.rate - a.baseline.rate) * 100)})`
        return `${x.pass}/${x.n}${d}${x.errors ? ` !${x.errors}` : ''}`
      }).join(' | ') + ' |')
    }
    out.push('', `Bundle deltas: ` + Object.entries(t.bundleDeltas[tier]).map(([k, v]) => `${k} ${pct(v)}`).join(', '), '')
    // Said once per tier rather than left to the reader: bundle C is entirely document body, and the
    // routing prompt stopped carrying the document after the first calibration run showed a 100%
    // baseline ceiling. C's routing column is therefore the same condition as baseline, so its delta
    // estimates rep-to-rep noise. Read as "C had no effect" it is simply wrong.
    if (t.byTier[tier] && Object.values(t.byTier[tier]).some(c => c.C))
      out.push(`> Routing arm **C is identical to baseline** by construction — the full document is no longer injected, and every bundle-C edit lives in it. Treat that column as a noise estimate, not as an effect.`, '')
  }
  if (t.callouts.length) {
    out.push('## Call-outs\n')
    for (const c of t.callouts) out.push(`- **${c.kind}** ${c.caseId}${c.arm ? ` (${c.arm}, ${c.tier})` : ''} ${JSON.stringify(c.rates ?? { from: c.from, to: c.to })}`)
  } else out.push('## Call-outs\n\nNone.')

  const p = t.provenance
  if (p) {
    out.push('', '## Provenance\n')
    out.push(`- Runs: ${p.runs}, of which ${p.errors} scored \`error\` and left the denominators.`)
    const dirty = p.isolation.includes('contaminated') || p.isolation.includes('host-settings')
    out.push(`- Isolation: ${p.isolation.length ? p.isolation.join(' + ') : 'unrecorded'}${dirty ? ' — **host settings were loaded for at least some runs, so hooks fired inside them.** Arm-invariant, but the skills gate can push a session to read more and mask bundle B.' : ''}`)
    out.push(`- Hook events observed: ${p.hookEvents}${p.hookEvents > 0 && !p.isolation.includes('contaminated') ? ' — non-zero in an isolated run means isolation did not hold.' : ''}`)
    for (const [tier, ids] of Object.entries(p.resolvedModels)) out.push(`- \`${tier}\` resolved to: ${ids.join(', ')}`)
  }
  return out.join('\n')
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { readFileSync } = await import('node:fs')
  const recs = readFileSync(process.argv[2], 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l))
  console.log(render(tally(recs)))
}
