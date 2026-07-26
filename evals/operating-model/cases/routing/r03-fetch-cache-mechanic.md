---
id: r03-fetch-cache-mechanic
family: routing
finding: control for L50 — a platform mechanic must stay a guideline under edit 8's default
targets: [C]
predicts: control
world: month-3
reps: {haiku: 10, opus: 5}
caps: {budgetUsd: 0.5, timeoutMs: 120000}
grade:
  type: destination
  expect: ["docs/guidelines/**"]
  forbid: ["docs/specs/**", "ARCHITECTURE.md"]
# Forbidden words in the body: guideline, platform, mechanic, framework.
# The control that catches edit 8 over-correcting: its default is "when unsure, leave it in
# the spec", and a genuine platform mechanic pushed into a spec is the regression.
---
Found this the hard way. Inside a Server Component, `fetch` results are cached by default, so a request for one user's data can come back on a later request belonging to a different user. You have to pass `cache: 'no-store'` explicitly. It will bite anywhere in the app that fetches per-user data.
