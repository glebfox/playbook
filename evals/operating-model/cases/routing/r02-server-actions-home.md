---
id: r02-server-actions-home
family: routing
finding: S2(v) — no step routes an architectural fact discovered while implementing
targets: [A]
predicts: fail-on-baseline
world: month-3
reps: {haiku: 10, opus: 5}
caps: {budgetUsd: 0.5, timeoutMs: 120000}
grade:
  type: destination
  expect: ["ARCHITECTURE.md"]
  forbid: ["docs/specs/**", "docs/guidelines/**"]
# Forbidden words in the body: convention, architecture, architectural.
---
Every write path in this app now goes through a Server Action. No route handler mutates data any more, and no client component touches the database directly. That is settled for the whole codebase and applies to write paths we haven't built yet.
