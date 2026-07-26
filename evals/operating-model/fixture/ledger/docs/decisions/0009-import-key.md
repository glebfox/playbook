# 0009 — `importKey` is a content hash, not the bank's identifier

**Status:** accepted

## Context

Both banks export overlapping windows: pulling January and then January–February re-delivers every January line. Imports have to be idempotent, so each imported row needs a stable handle that identifies "this line, from this export, already landed".

The obvious candidate is the identifier the bank puts in the export. It does not work here:

- One of the two banks omits the column entirely for card transactions.
- The other renumbers rows when a pending transaction settles, so the same movement arrives twice under two identifiers.
- Neither identifier is stable across a re-export of the same window, which is exactly the case that has to be idempotent.

Alternatives considered:

- **Bank identifier, falling back to a hash when absent.** Two key spaces in one column, and the fallback is the only path exercised for card rows. Rejected as the worst of both.
- **No key; dedupe by comparing whole rows at import time.** Quadratic in the export size, and it cannot tell a genuine repeated charge from a re-delivered one, because the discriminator is the export, not the row.

## Decision

`importKey = hash(accountId, occurredAt date, amountCents, normalized description)`. The description is trimmed and space-collapsed before hashing, so cosmetic export differences do not produce a second key. Manual entries carry `null`.

Uniqueness is enforced in the database by a partial unique index on `(accountId, importKey)` where `importKey is not null`, rather than by a check in application code — two concurrent imports of the same file would otherwise both pass a read-then-write check.

## Consequences

- Two genuinely identical charges on one day in one account — the same coffee twice — collide, and the second is dropped as a duplicate. Known, accepted, and the reason a manual entry never carries a key.
- The hash inputs are frozen: changing them invalidates every stored key, so a change means a migration that recomputes them.
- Deleted rows keep their key, which is what stops a re-import from resurrecting a row the user deleted deliberately.
