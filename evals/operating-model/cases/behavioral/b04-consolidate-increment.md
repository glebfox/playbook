---
id: b04-consolidate-increment
family: behavioral
finding: F2/S3 — ARCHITECTURE.md is in no write path, so a fact no unit owns has nowhere to land at consolidation
targets: [A]
predicts: fail-on-baseline
world: month-3-mid-increment
reps: {opus: 3}
caps: {budgetUsd: 3.0, timeoutMs: 900000}
grade:
  type: tool-log
  predicate: "saw(Write|Edit:ARCHITECTURE.md)"
# The landed increment adds a new build command (`pnpm db:seed`) alongside a transaction
# behavior, so correct consolidation touches the spec *and* ARCHITECTURE.md's command block. A
# purely unit-behavioral increment would make arm A's correct consolidation score fail.
# It deliberately does not describe the db/repositories/ move — r06 routes that exact fact.
---
The increment under `docs/increments/active/` is finished — all of its code has landed. Do whatever this repository's process says to do at that point.
