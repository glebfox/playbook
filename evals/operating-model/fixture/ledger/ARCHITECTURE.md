# Architecture

## Stack

- Next.js 15 (App Router), React 19, TypeScript 5.6, strict mode.
- Postgres 16 via Drizzle ORM; migrations in `db/migrations/`, generated not hand-written.
- Auth: Auth.js v5, credentials + Google provider, sessions in Postgres.
- Deployment: single Fly.io machine + Fly Postgres. No CDN, no edge runtime.
- Package manager: pnpm. Node 22.

## Layout

```
app/                    # Next.js routes; route groups (marketing)/(app)
components/             # presentational React components, no data access
domain/                 # pure business logic, no framework imports
  transaction/
  account/
  budget/
services/               # I/O boundaries: db access, external APIs
db/                     # drizzle schema + migrations
lib/                    # shared utilities
```

## Architectural conventions

- **All money amounts are integer cents** (`number`, never `float`, never `string`). Formatting happens only at the view boundary. See decision 0004.
- `domain/` may not import from `app/`, `services/`, or `db/`. Enforced by an eslint boundary rule.
- Mutations go through Server Actions, never route handlers. Route handlers exist only for webhooks. See decision 0006.
- Every Server Action validates input with a Zod schema colocated in the same file.
- All timestamps stored as `timestamptz`, always UTC; the browser localizes. See decision 0002.
- Rounding is half-up at the presentation boundary only; stored values are never rounded. See decision 0009.
- No ORM lazy loading — every query names its columns explicitly.
- Errors cross the Server Action boundary as a discriminated result union, never thrown. See decision 0008.

## Build / run / test

```
pnpm dev              # next dev, localhost:3000
pnpm build            # next build
pnpm test             # vitest run
pnpm test:e2e         # playwright
pnpm db:generate      # drizzle-kit generate
pnpm db:migrate       # apply migrations
pnpm lint             # eslint + tsc --noEmit
```

Requires a local Postgres; `docker compose up db` provides one on 5433.
