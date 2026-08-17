# Roadmap

One increment at a time. An increment is finished when its code has landed, its facts have been consolidated, and its directory has moved to `docs/increments/completed/`.

## Increments

| # | Increment | Status |
|---|---|---|
| 1 | Accounts and manual entry | done, 2026-04-06 — predates the increment log |
| 2 | CSV import, per-bank mapping, dedupe | done, 2026-04-28 — predates the increment log |
| 3 | Recurring transactions | done, 2026-05-12 — `docs/increments/completed/2026-05-12-recurring-transactions/` |
| 4 | Envelope budgets and period close | done, 2026-06-30 |
| 5 | — | nothing in progress |

Increments 1 and 2 were built before this documentation set existed; what survives of their design is in `ARCHITECTURE.md` and in decisions 0002, 0006 and 0007. Increment 4's directory was consolidated and removed before the log convention settled, which is why only increment 3 has one.

## Backlog

Not scheduled, and deliberately unordered past the first entry.

- **Export.** CSV out, one file per account per period, plus a whole-database dump. Next up.
- **Yearly view.** Per-category totals across periods, with the period breakdown one click away.
- **Category rules learned from corrections.** Suggest a rule when the same manual correction has been made three times.
- **Category hierarchy.** Parent categories, with budgets settable at either level. Needs a data-model decision first.
- **Import format drift.** A per-bank format version, so a changed export fails with a diagnosis instead of a column error.
- **Attachment per transaction.** A single file, stored on the machine, for the one case a year that needs a document attached.
