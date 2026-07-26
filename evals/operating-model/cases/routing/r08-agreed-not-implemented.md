---
id: r08-agreed-not-implemented
family: routing
finding: S5(f) — a choice agreed but not yet implemented is still intent, not current state
targets: [A]
predicts: fail-on-baseline
world: month-3
reps: {haiku: 10, opus: 5}
caps: {budgetUsd: 0.5, timeoutMs: 120000}
grade:
  type: destination
  expect: ["docs/vision.md", "docs/roadmap.md"]
  forbid: ["docs/decisions/**", "ARCHITECTURE.md", "docs/specs/**"]
# Forbidden words in the body: decision, intent, backlog, roadmap, vision.
---
We agreed this morning to support more than one currency. None of it is written: every amount in the code is still an integer number of cents in a single currency, and the schema has no currency column at all.
