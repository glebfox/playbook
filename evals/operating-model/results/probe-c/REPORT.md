## haiku

| case | predicts | baseline | A | B | C | ALL |
|---|---|---|---|---|---|---|
| r01-money-rounding-home | fail-on-baseline | 0/1 | — | — | — | — |
| r02-server-actions-home | fail-on-baseline | 1/1 | — | — | — | — |
| r03-fetch-cache-mechanic | control | 1/1 | — | — | — | — |
| r04-future-date-rule | fail-on-baseline | 1/1 | — | — | — | — |
| r05-intended-stack-home | fail-on-baseline | 0/1 | — | — | — | — |
| r06-partial-migration-directive | fail-on-baseline | 1/1 | — | — | — | — |
| r07-cross-unit-invariant | control | 1/1 | — | — | — | — |
| r08-agreed-not-implemented | fail-on-baseline | 0/1 | — | — | — | — |
| r09-rationale-home | control | 1/1 | — | — | — | — |
| r10-untested-behavior | control | 1/1 | — | — | — | — |
| r11-commit-format | control | 1/1 | — | — | — | — |
| r12-existing-unit-different-framing | control | 1/1 | — | — | — | — |

Bundle deltas: A —, B —, C —, ALL —

## opus

| case | predicts | baseline | A | B | C | ALL |
|---|---|---|---|---|---|---|
| r01-money-rounding-home | fail-on-baseline | 1/1 | — | — | — | — |
| r02-server-actions-home | fail-on-baseline | 1/1 | — | — | — | — |
| r03-fetch-cache-mechanic | control | 1/1 | — | — | — | — |
| r04-future-date-rule | fail-on-baseline | 1/1 | — | — | — | — |
| r05-intended-stack-home | fail-on-baseline | 0/1 | — | — | — | — |
| r06-partial-migration-directive | fail-on-baseline | 1/1 | — | — | — | — |
| r07-cross-unit-invariant | control | 1/1 | — | — | — | — |
| r08-agreed-not-implemented | fail-on-baseline | 1/1 | — | — | — | — |
| r09-rationale-home | control | 1/1 | — | — | — | — |
| r10-untested-behavior | control | 1/1 | — | — | — | — |
| r11-commit-format | control | 1/1 | — | — | — | — |
| r12-existing-unit-different-framing | control | 1/1 | — | — | — | — |

Bundle deltas: A —, B —, C —, ALL —

## Call-outs

- **theoretical-finding** r02-server-actions-home {"haiku":1,"opus":1}
- **theoretical-finding** r04-future-date-rule {"haiku":1,"opus":1}
- **theoretical-finding** r06-partial-migration-directive {"haiku":1,"opus":1}

## Provenance

- Runs: 24, of which 0 scored `error` and left the denominators.
- Isolation: safe-mode
- Hook events observed: 0
- `haiku` resolved to: claude-haiku-4-5-20251001
- `opus` resolved to: claude-opus-5
