# Guideline — testing

How tests are written and run. **What is covered is not recorded here** — coverage lives per unit, in `docs/tests/<unit-path>.md`, one table per unit with a row per behavior. This file is about practice; those files are about state.

## Harness

- **Vitest** for unit and integration tests. See decision 0003.
- **Playwright** for end-to-end, two flows only: sign in and land on the transaction list, and import a small CSV and see the summary. Anything more is a maintenance bill this project cannot pay.

```
pnpm test             # vitest run — unit + integration
pnpm test -- --watch  # while working
pnpm test:e2e         # playwright, needs the dev server up
```

Integration tests need the local database: `docker compose up db` first. They are not mocked, and a mocked database test is not accepted as a substitute — the constraints being relied on are in the schema, not in the code.

## The three kinds

**Unit** — a function in `domain/` or `lib/`, called directly, no I/O. These are the majority and they are fast. A domain rule with no unit test is a defect, not a gap.

**Integration** — a query module in `db/` against a real database, in a transaction that rolls back. This is where uniqueness constraints, soft-delete filters and derived balances are checked, because all three are properties of the schema and its queries rather than of a function.

**End-to-end** — the two flows above. Treated as smoke tests: they catch wiring, not logic.

## Writing them

- One behavior per test, named as the behavior: `rejects a zero amount`, not `test createTransaction 2`.
- Build inputs with the per-unit builders in `domain/<unit>/__fixtures__`, overriding only the field under test, so an added required field does not touch fifty tests.
- Assert on values, never on snapshots. A snapshot of a money figure records a bug as faithfully as it records correctness.
- Test the rule where the rule lives. A domain invariant checked through a rendered page is an end-to-end test wearing a unit test's name.
- Failure cases are tested by their tag, not their message: `expect(result.error.tag).toBe('PERIOD_CLOSED')`.

## Gaps

A behavior that is stated in a spec and not covered by an automated test is a **gap**, and a gap is recorded — in the unit's coverage file, with the reason and the risk, in the same row as the behavior. An untested behavior that nobody wrote down is the thing this convention exists to prevent.

Two reasons are legitimate: the check needs machinery out of proportion to the risk, or the behavior is verified by hand and the verification is cheap and frequent. Both get written down in those words. "Not yet" is also acceptable, as long as it says so — what is not acceptable is a coverage file that reads complete while a behavior in the spec has no row at all.
