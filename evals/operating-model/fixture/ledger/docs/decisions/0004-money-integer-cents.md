# 0004 — Money amounts are integer cents

**Status:** accepted

## Context

Ledger stores transaction amounts, budget limits, and running balances. Amounts arrive from CSV bank exports as decimal strings (`-42.07`), and are displayed with two fractional digits. We need one representation that survives JSON serialization across the Server Action boundary, sums without drift, and round-trips through Postgres and Drizzle without a custom type.

Alternatives considered:

- **`float`/`double precision`.** Rejected outright: `0.1 + 0.2` drift is unacceptable for a ledger whose whole purpose is that balances reconcile.
- **Postgres `NUMERIC(12,2)` + decimal.js in app code.** Correct arithmetic, but Drizzle returns `NUMERIC` as a JS string, so every read needs a wrap/unwrap, `decimal.js` objects are not JSON-serializable across the Server Action boundary, and every arithmetic site becomes `a.plus(b)` instead of `a + b`. Cost is paid on every line of business logic forever.
- **String amounts everywhere, arithmetic only in SQL.** Pushes all summation into queries; makes `domain/` unable to compute anything, which contradicts the "domain is pure business logic" boundary.

## Decision

Store and pass all monetary amounts as **integer cents** in a plain `number`. Postgres column type `bigint`; Drizzle mode `number`. Parse at the ingest boundary (CSV import, form input), format at the view boundary (`lib/money.ts`). No monetary value in any other representation ever crosses a module boundary.

Safe-integer headroom: 2^53 cents is ~$90 trillion, far beyond scope.

## Consequences

- Arithmetic is ordinary integer arithmetic; sums are exact; no library.
- Any percentage or split operation must decide a rounding rule explicitly, because integer division truncates. This decision does not settle which rule; nothing has needed one yet.
- Currencies with other minor-unit exponents (JPY: 0, KWD: 3) are not supported. Multi-currency would require revisiting this — likely by storing a per-amount exponent rather than by changing the integer representation.
- Anything reading the DB outside the app (a psql query, a BI tool) sees cents, not dollars, and will mislead a casual reader.
