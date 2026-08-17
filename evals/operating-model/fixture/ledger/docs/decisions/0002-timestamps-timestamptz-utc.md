# 0002 — Timestamps stored as `timestamptz`, always UTC

**Status:** accepted

## Context

Bank exports carry local dates with no zone. The first import wrote them as naive dates, and a transaction made at 23:40 on the last day of a month landed in the wrong budget period once the browser localized it.

## Decision

Every timestamp column is `timestamptz` and every value written is UTC. Local presentation happens in the browser, from the user's own zone. Dates parsed out of an import are anchored to the account's zone at ingest, once, and never re-interpreted afterwards.

## Consequences

- Budget-period boundaries are computed against the account zone, not the server zone, so the server's zone stops mattering.
- Anything comparing an imported date with a hand-entered one compares two UTC instants.
- A user who moves zones sees old entries shift by the offset. Accepted: there is one household and it does not travel much.
