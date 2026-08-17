# Transaction (domain) — coverage

Harness and patterns: `docs/guidelines/testing.md`.

| Behavior | How checked | Where |
|---|---|---|
| create with valid input returns Ok | automated unit | `domain/transaction/create.test.ts` |
| zero amount rejected | automated unit | same |
| description trimmed + space-collapsed | automated unit | same |
| signed amounts survive an edit | automated unit | same |
| edit blocked when period closed | automated unit | `domain/transaction/edit.test.ts` |
| soft delete excludes from balance | automated integration | `db/ledger.int.test.ts` |
| balance derived at read time | automated integration | `db/ledger.int.test.ts` |
| uuid v7 ordering under concurrent insert | **gap** | not tested — needs concurrent load; monotonicity is library-guaranteed and cheap to trust |
| category rule ordering (first match wins) | automated unit | `domain/transaction/rules.test.ts` |
| category rule ordering with >20 rules | **gap** | not tested — no known project reaching that count yet |
| balance derivation over 100k rows | **gap** | not measured — a performance question rather than a correctness one; revisit when a real account gets there |
| exactness of large sums (10k rows) | automated unit | `domain/transaction/sum.test.ts` |
