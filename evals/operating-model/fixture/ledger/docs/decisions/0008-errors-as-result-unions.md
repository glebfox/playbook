# 0008 — Errors cross boundaries as discriminated result unions

**Status:** accepted

## Context

Thrown errors do not survive the boundary between server code and the browser in any useful form: the message is replaced in production builds and the type is gone. Expected failures — a closed period, a duplicate row — were arriving at the UI indistinguishable from a crash.

## Decision

Anything that can fail for a business reason returns `Result<T, E>` with a discriminated `E`. Exceptions are reserved for bugs and for infrastructure that is genuinely unavailable. The UI branches on the tag and never on a message string.

## Consequences

- Callers handle failure explicitly; there is no `try` around business logic.
- Adding a failure case is a type error at every call site, which is the point.
- Two layers of error vocabulary exist — result tags for expected failures, exceptions for the rest — and the boundary between them has to be argued case by case.
