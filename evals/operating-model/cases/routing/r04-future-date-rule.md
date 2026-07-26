---
id: r04-future-date-rule
family: routing
finding: P4 — the spec-vs-guideline asymmetry; a unit fact promoted to a guideline is contagious
targets: [C]
predicts: fail-on-baseline
world: month-3
reps: {haiku: 10, opus: 5}
caps: {budgetUsd: 0.5, timeoutMs: 120000}
grade:
  type: destination
  expect: ["docs/specs/domains/transaction.md"]
  forbid: ["docs/guidelines/**", "ARCHITECTURE.md"]
# Forbidden words in the body: guideline, spec, unit, convention.
# The bait is the closing sentence: the check's *shape* is shared, so a guideline is tempting —
# but the subject is the transaction unit, and budgets legitimately start in the future, so a
# guideline would hand them a rule that is false for them.
---
We settled that a transaction cannot be dated in the future. `rejectFutureDate` in `domain/transaction/rules.ts` returns a `Result` with a `FUTURE_DATE` error, so nothing reaches the database. It is the same shape of boundary check we write for other user input around the app.
