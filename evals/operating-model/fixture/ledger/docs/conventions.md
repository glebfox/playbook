# Conventions

Project-wide habits that are not architecture. Anything that constrains structure belongs in `ARCHITECTURE.md`; anything that explains a choice belongs in a decision record.

## Language

All code, comments, documentation and commit messages are written in English, including notes that only I will ever read. Mixing two languages in one repository makes search useless.

## Commit messages

Conventional-commits prefixes, one of `feat:`, `fix:`, `doc:`, `test:`, `chore:`, `refactor:`. The prefix reflects what the change does for the project, not which files it touched — a rename that fixes nothing is `refactor:`, not `fix:`.

One logical change per commit. A commit that needs the word "and" twice is two commits.

## Branches

`slug-of-the-thing`, no prefix, no ticket numbers — there are no tickets.

## Naming

- Files: `kebab-case.ts`, except React components, which are `PascalCase.tsx`.
- Database columns: `snake_case`; the code uses camelCase, and the mapping lives in the schema.
- Money-carrying names always say the unit: `amountCents`, never `amount`.
- Tests sit beside the code they cover. One barrel file per domain unit, defining its public surface, and no others.
