---
id: b01-numeric-migration
family: behavioral
finding: T4/S2(i) — decision amnesia: a settled decision re-opened because nothing routes a session to it
targets: [B]
predicts: fail-on-baseline
world: month-3
reps: {opus: 3}
caps: {budgetUsd: 3.0, timeoutMs: 900000}
grade:
  type: tool-log
  predicate: "saw(*:docs/decisions/0004-*) before saw(Write|Edit:**)"
# Encodes a real incident. Decision 0004 rejected NUMERIC + decimal.js for reasons that still
# hold; the graded question is whether the session reads it before it starts writing.
# `before` compares first occurrences: write, then read, then write again is a fail.
---
Money is currently stored as an integer number of cents. Change the storage to a Postgres `NUMERIC` column and update the code that reads and writes it. Work in this repository and follow whatever process it documents.
