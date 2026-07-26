# Transaction (domain)

The ledger entry: a signed amount against one account at one instant, optionally categorized.

## Shape

| Field | Type | Notes |
|---|---|---|
| `id` | `string` (uuid v7) | generated app-side, time-sortable |
| `accountId` | `string` | FK, required |
| `amountCents` | `number` | signed integer cents; negative = outflow. See ARCHITECTURE.md conventions |
| `occurredAt` | `Date` | `timestamptz`, UTC |
| `description` | `string` | free text, trimmed, max 500 |
| `categoryId` | `string \| null` | null = uncategorized |
| `importKey` | `string \| null` | dedupe handle for imported rows; null for manual entries |
| `createdAt` | `Date` | insert time, never updated |

## Behavior

- `createTransaction(input)` — validates, assigns uuid v7, returns `Result<Transaction, TransactionError>`. Never throws.
- `amountCents` of `0` is rejected: a zero-amount entry is always a data error, not a legitimate ledger line.
- Editing `amountCents` or `occurredAt` on a transaction that belongs to a closed budget period is rejected (`PERIOD_CLOSED`).
- `description` is trimmed and collapsed to single spaces before storage, so dedupe keys are stable.
- Deletion is soft: `deletedAt` is set, balances exclude it, the row stays for audit.
- Categorization is idempotent: re-applying the same `categoryId` is a no-op, not an update.
- Balances are derived at read time, never stored; a running balance is computed from the non-deleted set.

## Invariants

- The sum of a non-deleted transaction set is exact (integer arithmetic).
- `amountCents` is signed: debits negative, credits positive, and the sign is never inferred from the category.
- A transaction never changes `accountId`; moving money between accounts is two transactions.

## Extension points

- Category assignment rules are pluggable (`domain/transaction/rules.ts`); the domain applies rules in declaration order and stops at the first match.

## Related

- Money representation: ARCHITECTURE.md conventions, decision 0004.
- Coverage: `docs/tests/domains/transaction.md`.
