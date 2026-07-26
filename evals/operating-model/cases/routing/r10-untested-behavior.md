---
id: r10-untested-behavior
family: routing
finding: control for edit 6 (parked) — coverage state must still route to the test doc
targets: []
predicts: control
world: month-3
reps: {haiku: 10, opus: 5}
caps: {budgetUsd: 0.5, timeoutMs: 120000}
grade:
  type: destination
  expect: ["docs/tests/domains/transaction.md"]
  forbid: ["docs/specs/domains/transaction.md", "docs/guidelines/**"]
# Forbidden words in the body: coverage, gap, matrix, test doc, TODO.
#
# Watch this one at calibration. It is mildly braided: the prompt opens with a behavior but its
# payload is the coverage status, so a reader could route it to the spec. It is defensible as
# written — only the test doc holds the composite fact, gaps-with-reasons are first-class there,
# and the spec already documents categorization idempotence as behavior, which pushes a careful
# reader toward "the new information here is that nobody checks it". But if strong models answer
# with the spec during the N=1 calibration run, reweight the body to lead with the coverage status
# rather than the behavior, and re-freeze. Do not discover this at N=10.
---
Re-categorizing a transaction twice in a row should end up in the same state as doing it once. Nobody has automated a check for it — it has been tried by hand a couple of times, and the risk looks low because the result is visible in the UI immediately.
