# Plan — seed command and backdating an imported transaction

- [x] `db/seed.ts`: deterministic generator, local-database guard, wipe-and-insert.
- [x] `db:seed` script in `package.json`.
- [x] Recompute the dedupe handle on an `occurredAt` edit, in the transaction unit.
- [x] Reject the edit when the recomputed handle collides; new error tag `DUPLICATE_AFTER_EDIT`.
- [x] Tests: backdate into a collision, backdate into a free slot, backdate a manual entry.
- [x] Ran the seed against a scratch database twice and compared.

Everything above has landed on `main`. The increment is finished as far as the code goes.
