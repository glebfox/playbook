# Increment — seed command and backdating an imported transaction

**Started:** 2026-07-20. Code has landed; nothing has been consolidated yet.

## Problem

Two unrelated annoyances, bundled because both touch the import path and neither is worth an increment alone.

**A fresh checkout has an empty database.** Every time the schema changes enough to want a reset, three months of test data are re-imported by hand from a saved export. It takes twenty minutes and the result is slightly different each time.

**Correcting the date of an imported transaction can create a duplicate.** A card charge sometimes arrives dated the settlement day rather than the day it happened. Editing `occurredAt` to the real day is the correct fix, but the dedupe handle is derived from the date, so the next import of that window no longer recognizes the row and inserts it a second time.

## Approach

**A seed command.** `pnpm db:seed` wipes the seedable tables and inserts two accounts, the category set, and three months of deterministic transactions. It refuses to run unless the target database name is the local one — the check is crude and it is the only thing between this command and a bad afternoon. The generator is deterministic, so two seeded databases compare cleanly.

**Backdating recomputes the dedupe handle.** Editing `occurredAt` on an imported transaction recomputes its handle from the new date and re-runs the duplicate check before the edit is accepted. If the recomputed handle collides with a row already in the account, the edit is rejected as a duplicate rather than silently creating one — the collision means the movement is already recorded under the correct date.

Manual entries are unaffected: they carry no handle, so backdating one is an ordinary edit.

## What was rejected

- **Freezing the handle at insert time.** Would fix the duplicate and break the idempotence guarantee in the other direction: a re-imported window would arrive with a handle computed from the export's date and match nothing.
- **Seeding from a checked-in export file.** Real data in the repository, and the file drifts from the schema silently.
