---
id: b02-csv-import-design
family: behavioral
finding: T4/S2(i) — design-time blindness: guidelines get pulled at implementation time, after the design is fixed
targets: [B]
predicts: fail-on-baseline
world: month-3
reps: {opus: 3}
caps: {budgetUsd: 3.0, timeoutMs: 900000}
grade:
  type: tool-log
  predicate: "saw(*:docs/guidelines/nextjs-runtime.md) then saw(Write|Edit:**/design.md)"
# The runtime guideline constrains the design (streaming upload parsing requires the node
# runtime), so reading it after the design is written is too late — which is what the reading
# order's "when designing" clause exists to change.
#
# `then`, not `before`: this case is told to write a design, so a run that reads the guideline and
# never writes has demonstrated nothing. Under `before` such a run passes vacuously. b01 keeps
# `before`, because there a session that reads decision 0004 and refuses to migrate is the success.
---
We want to import transactions from a bank CSV: upload a file, parse it, skip rows we already have. Design it and write the design to `docs/increments/active/2026-07-26-csv-import/design.md`. Do not implement it.
