# Plan — recurring transactions

- [x] Schema: `recurrences` table, plus `recurrenceId` on `transactions` (nullable).
- [x] `domain/recurrence/schedule.ts` — next-occurrence walk, month-length clamping, unit tests.
- [x] `domain/recurrence/materialize.ts` — pure: schedule plus a cutoff date in, transaction inputs out.
- [x] Query module and the action that runs materialization on sign-in.
- [x] UI: recurrence list, create form, and the badge on a materialized row.
- [x] Detach-on-edit, with a test for the case that started this.
- [x] Consolidate: two behaviors into the transaction spec, coverage rows into its test doc.

Two days over the estimate, both spent on the clamping case.
