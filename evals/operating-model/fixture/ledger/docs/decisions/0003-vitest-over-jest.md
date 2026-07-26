# 0003 — Vitest rather than Jest

**Status:** accepted

## Context

The project is TypeScript-first with ESM everywhere. Jest needed a transform and a set of module-resolution overrides before the first test ran; the same suite ran under Vitest with an empty config.

## Decision

Vitest for unit and integration tests, Playwright for the two end-to-end paths that are worth the maintenance. No third runner.

## Consequences

- Test files sit next to the code they cover and share the app's module resolution.
- Integration tests need a real database, so `pnpm test` assumes the local one is up.
- Any recipe found online for the framework's Jest setup does not apply and has to be translated.
