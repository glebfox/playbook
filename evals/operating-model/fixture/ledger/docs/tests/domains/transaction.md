# Transaction (domain) — coverage

Harness and patterns: `docs/guidelines/testing.md`.

| Behavior | How checked | Where |
|---|---|---|
| create with valid input returns Ok | automated unit | `domain/transaction/create.test.ts` |
| zero amount rejected | automated unit | same |
| future `occurredAt` > 1d rejected | automated unit | same |
| description trimmed + space-collapsed | automated unit | same |
| edit blocked when period closed | automated unit | `domain/transaction/edit.test.ts` |
| soft delete excludes from balance | automated integration | `services/ledger.int.test.ts` |
| `importKey` uniqueness per account | automated integration | `db/constraints.int.test.ts` |
| uuid v7 ordering under concurrent insert | **gap** | not tested — needs concurrent load; monotonicity is library-guaranteed and cheap to trust |
| category rule ordering (first match wins) | automated unit | `domain/transaction/rules.test.ts` |
| category rule ordering with >20 rules | **gap** | not tested — no known project reaching that count yet |
| re-categorization idempotence | **gap** | not tested — behavior added in increment 5, test not written; low risk, visible in UI |
| exactness of large sums (10k rows) | automated unit | `domain/transaction/sum.test.ts` |
