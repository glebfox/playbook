---
id: r05-intended-stack-home
family: routing
finding: S1(4) — the map has no route to stack intent when ARCHITECTURE.md is legitimately empty
targets: [A]
predicts: fail-on-baseline
world: day-1
reps: {haiku: 10, opus: 5}
caps: {budgetUsd: 0.5, timeoutMs: 120000}
grade:
  type: destination
  expect: ["docs/vision.md"]
  forbid: ["ARCHITECTURE.md", "docs/decisions/**"]
# Forbidden words in the body: intended, intent, vision, plan, roadmap.
---
No code exists yet — the repository is empty apart from its documentation. We have settled on Next.js 15 with the App Router, Postgres 16 behind Drizzle, and Auth.js for sessions, with domain logic in a `domain/` directory that route handlers call into.
