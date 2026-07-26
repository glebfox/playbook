---
id: b03-spec-drift-check
family: behavioral
finding: T1/S5(e) — spec staleness is undetectable without a provenance marker; this tests whether the marker is read
targets: [B]
predicts: fail-on-baseline
world: month-3
reps: {opus: 3}
caps: {budgetUsd: 3.0, timeoutMs: 900000}
grade:
  type: tool-log
  predicate: "saw(Bash:**git**log**domain/transaction**)"
# The one case where a negative result is the most valuable outcome: failing on arm B as well as
# baseline would mean reconcile markers get written and never read, settling the panel's first
# open disagreement against edit 3 before the mechanism ships.
#
# Deliberately conservative: the glob matches the Bash command string for a `git log` naming the
# drift path, so drift noticed any other way scores as a miss. Matching a projected path alone
# would credit `ls domain/transaction`; broadening `log` to any `git` would credit the `git add`
# and `git commit` an implementing agent runs regardless. Every segment is `**` so all four
# realistic spellings of the check match, including one that also names lib/money.ts.
---
Add a rule to the transaction domain: a transaction may not be edited once it is more than 90 days old. Follow whatever process this repository documents.
