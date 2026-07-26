---
id: r07-cross-unit-invariant
family: routing
finding: S8 — the owner of a shared invariant is whoever enforces it
targets: []
predicts: control
world: month-3
reps: {haiku: 10, opus: 5}
caps: {budgetUsd: 0.5, timeoutMs: 120000}
grade:
  type: destination
  expect: ["docs/specs/domains/transaction.md"]
  forbid: ["ARCHITECTURE.md", "docs/specs/domains/budget.md"]
# Forbidden words in the body: contract, spec, guideline, cross-cutting.
---
An imported transaction carries an `importKey`, and the database enforces that it is unique per account whenever it is not null — a partial unique index on the transactions table. Budgets never set one.
