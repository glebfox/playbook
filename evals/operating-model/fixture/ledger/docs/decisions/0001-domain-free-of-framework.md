# 0001 — `domain/` stays free of framework imports

**Status:** accepted

## Context

The first week's code had validation rules living inside route files, which meant a rule could only be exercised by rendering a page. Two rules were already duplicated between a form handler and an import path.

## Decision

Business rules live in `domain/`, which imports nothing from the framework, the database layer, or `app/`. Anything that needs I/O takes it as an argument.

## Consequences

- Rules are unit-testable without a running server or a database.
- Some plumbing is written by hand that a framework helper would have covered.
- An eslint boundary rule enforces the direction, because the mistake is easy to make and invisible in review.
