---
id: r01-money-rounding-home
family: routing
finding: F2/S3 — a fact no unit owns, and ARCHITECTURE.md is in no write path
targets: [A]
predicts: fail-on-baseline
world: month-3
reps: {haiku: 10, opus: 5}
caps: {budgetUsd: 0.5, timeoutMs: 120000}
grade:
  type: destination
  expect: ["ARCHITECTURE.md"]
  forbid: ["docs/specs/**", "docs/guidelines/**", "docs/decisions/**"]
# Forbidden words in the body: convention, architecture, architectural, guideline.
---
A one-line change to `lib/money.ts` just settled how this app rounds. Amounts round half-up when they are formatted for display, and stored values are never rounded. That holds everywhere in the codebase — there is no single feature or module it belongs to, and `lib/money.ts` is a helper, not one of the units we keep specs for.
