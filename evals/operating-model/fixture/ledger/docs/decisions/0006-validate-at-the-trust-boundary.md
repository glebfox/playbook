# 0006 — Input is validated once, at the trust boundary, with Zod

**Status:** accepted

## Context

Input arrives from three places: a form, a CSV file, and a JSON body a webhook posts. Early code validated in whichever layer noticed first, so a malformed amount was caught in three different shapes and missed entirely on the import path.

## Decision

Each entry point declares a Zod schema and parses before anything else runs. Past that point the value is typed and trusted; `domain/` re-checks business rules but never re-checks shapes.

## Consequences

- One error format per entry point, produced by the schema rather than by hand.
- `domain/` functions take narrow types and can assume them, which keeps the rules readable.
- A schema and a domain rule can drift apart; the guard against that is that the rule owns the invariant and the schema owns only the shape.
