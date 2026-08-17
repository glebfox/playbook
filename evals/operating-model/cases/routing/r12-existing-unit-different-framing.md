---
id: r12-existing-unit-different-framing
family: routing
finding: P3 — the axis failure is duplicate creation, not unfindability
targets: [B]
predicts: control
world: month-3
reps: {haiku: 10, opus: 5}
caps: {budgetUsd: 0.5, timeoutMs: 120000}
grade:
  type: destination
  expect: ["docs/specs/domains/transaction.md"]
  forbid: ["docs/specs/features/**", "docs/specs/components/**", "docs/specs/services/**", "docs/guidelines/**"]
# Forbidden words in the body: axis, domain, spec, feature, component.
# The temptation is a new docs/specs/features/csv-import.md; the subject is transaction behavior
# and that unit already has a file. This is the duplicate-creation failure, so forbid names the
# plausible wrong axes rather than a category.
---
Transactions that arrived through a file import keep a reference to the batch they came in with, and every rule that applies to a hand-entered transaction applies to them too.
