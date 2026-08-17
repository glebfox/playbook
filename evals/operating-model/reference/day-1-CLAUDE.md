# Ledger — Guidance

Map of this repository's knowledge base. A table of contents, not an encyclopedia — read the linked docs for detail rather than duplicating it here.

## Documentation Map

- **ARCHITECTURE.md** — stack, layout, build/run/test, architectural conventions. How the product is *built* (current facts, not plans).
- **docs/conventions.md** — code style and commit conventions. How code is *written and committed*.
- **docs/guidelines/** — reusable cross-cutting mechanics: how the framework/platform works, plus the test harness & strategy. Pointers only; not loaded by default.   <!-- DOES NOT EXIST ON DAY 1 -->
- **docs/decisions/** — append-only log of significant decisions: context, choice, rejected alternatives. The *why* behind the facts.   <!-- DOES NOT EXIST ON DAY 1 -->
- **docs/vision.md** — what we are building and why; scope and rationale; increment descriptions.
- **docs/roadmap.md** — the increment sequence and status, plus the future-development backlog. What is left to do.
- **docs/specs/<axis>/*.md** — current API/behavior of each unit. The system of record per unit.   <!-- DOES NOT EXIST; <axis> UNRESOLVED -->
- **docs/tests/<axis>/*.md** — per-unit test-coverage matrix (automated vs live), mirroring the specs.   <!-- DOES NOT EXIST; <axis> UNRESOLVED -->
- **docs/increments/** — per-increment directory with `design.md` + `plan.md` (`active/` → `completed/`).   <!-- DOES NOT EXIST ON DAY 1 -->

## Workflow

- Each increment runs its own cycle: brainstorm → design (`docs/increments/active/<slug>/design.md`) → plan (`plan.md` next to it) → execute → consolidate durable knowledge into `docs/specs/<axis>/*.md`, the test-coverage matrix into `docs/tests/<axis>/*.md`, reusable mechanics into `docs/guidelines/`, significant decisions into `docs/decisions/` → move the increment's directory to `completed/`.
- Work smaller than an increment (fixes, chores) skips the cycle, but not consolidation: if durable behavior changed, update the affected specs, test docs, and decisions as part of the same change.

## Documentation Hygiene

- Keep this file a thin map. Architectural facts → ARCHITECTURE.md; code/commit conventions → docs/conventions.md; product intent → docs/vision.md; unit state → docs/specs/<axis>/; unit test coverage → docs/tests/<axis>/; cross-cutting framework/platform mechanics (incl. the test harness) → docs/guidelines/; decision rationale → docs/decisions/. Don't duplicate here.
- A spec says *what a unit is*; the framework/platform mechanics behind it (the *how*) live in docs/guidelines/, not in a spec. Unit-fact vs framework-mechanic, not unique-vs-shared. The same split applies to tests: per-unit coverage → docs/tests/<axis>/; the test harness & strategy → docs/guidelines/. A test doc lists gaps too (not-yet-tested behaviors, with a reason), so it doubles as a TODO.
- After an increment touches a unit, update its durable spec and its test-coverage doc so both reflect reality.
- Facts and their why live apart: a living doc links to the docs/decisions/ entry for rationale, never restates it. A decision file is never edited to match the present — supersede it with a new one.
- An increment's design and plan stop being the source of truth once its directory moves to `completed/`.

<!-- OBSERVED: 5 of 9 map pointers are dead paths on day 1. No pointer to the operating model itself. -->
<!-- OBSERVED: map + hygiene bullet 1 encode the same routing table twice (violates "no duplication"). -->
