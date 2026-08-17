# 0007 — Deletion is soft

**Status:** accepted

## Context

A misplaced click deleted a transaction during the second week, and the only recovery was re-importing the whole month. A ledger whose point is reconciliation cannot lose rows silently, and an import that re-adds a row the user deleted on purpose is just as bad.

## Decision

Rows are retired by setting `deletedAt`. Balances, budgets and exports read from the non-deleted set. The dedupe handle survives deletion, so re-importing the same line does not resurrect it.

## Consequences

- Every read path has to remember the filter; the query modules in `db/` own it so callers cannot forget.
- The table grows without bound. At this scale that is nothing.
- "Delete everything for this account" is a real operation and is not implemented; nobody has needed it.
