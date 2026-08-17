# Budget (domain)

An envelope: one spending limit for one category over one period, and the remaining figure derived from the transactions that fall inside it.

## Shape

| Field | Type | Notes |
|---|---|---|
| `id` | `string` (uuid v7) | generated app-side |
| `categoryId` | `string` | FK, required; one budget per category per period |
| `periodStart` | `Date` | `timestamptz`, UTC, inclusive |
| `periodEnd` | `Date` | `timestamptz`, UTC, exclusive |
| `limitCents` | `number` | non-negative integer cents. See ARCHITECTURE.md conventions |
| `closedAt` | `Date \| null` | null = open; set when the period is reconciled |

## Behavior

- `createBudget(input)` — validates, returns `Result<Budget, BudgetError>`. Never throws.
- **A `limitCents` of `0` is accepted and meaningful**: zero is a legitimate limit, the way the household says "nothing at all in this category this month". It is not the same as the absence of a budget — a zero limit reports every spend as an overage, no budget reports nothing.
- **A budget may start in the future.** Next month's envelopes are routinely created before the month begins; a budget whose `periodStart` is ahead of today is simply not yet active. Only `periodEnd` before `periodStart` is rejected.
- Remaining is derived: `limitCents` minus the sum of non-deleted transactions in the category whose `occurredAt` falls in `[periodStart, periodEnd)`. Never stored.
- Closing a period sets `closedAt` and freezes the movements inside it; edits to those transactions are rejected (`PERIOD_CLOSED`). Reopening is allowed and logged.
- Overspend is reported, never blocked: the domain has no authority to refuse a movement that already happened at a bank.

## Invariants

- `limitCents >= 0`. A negative limit has no meaning; a category the household earns money in is not a budget.
- Periods for one category never overlap.
- A closed period's derived remaining figure never changes afterwards, because the movements inside it are frozen.

## Extension points

- Period generation is pluggable (`domain/budget/periods.ts`): calendar month today, arbitrary ranges are already representable.

## Related

- Money representation: ARCHITECTURE.md conventions, decision 0004.
- Period boundaries and zone handling: decision 0002.
