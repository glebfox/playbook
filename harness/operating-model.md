# Operating Model: Repository as System of Record (lightweight development harness)

Use this as the documentation and workflow model for the project — a lightweight harness for how work is captured, structured, and carried out across sessions. Spec-driven development is one part of it, not the whole. Goal: durable knowledge lives in the repository in a structured, deduplicated, progressively-disclosed form — so any session (human or agent) can pick up work without re-reading everything or re-deriving decisions. No heavy frameworks (no OpenSpec-style spec-driven-development tooling); the per-task plan/implement engine is whatever skill flow we already use, layered under a project-level doc structure.

## Principles

- **System of record is the repo, not chat.** Decisions, intent, and current state live in versioned docs, not in conversation history.
- **Table of contents, not encyclopedia.** The entry-point file is a thin map of pointers; detail lives in the documents it links to.
- **Progressive disclosure.** Start from a small stable entry point; follow links to deeper sources only when needed.
- **No duplication.** Every fact has exactly one home. Other docs link to it, never restate it.
- **Source of truth follows the work.** Long-lived knowledge (architecture, product intent, per-unit specs, cross-cutting guidelines) is *maintained* to reflect reality and is always the source of truth. A per-epic design and plan are authoritative only while in `active/` — that is the work we are currently executing. Moving them to `completed/` is the moment they stop being the source of truth: they become history, are not updated again, and are expected to diverge from the code as it evolves. Don't consult a `completed/` design or plan for current behavior.

## Document structure

```
CLAUDE.md / AGENTS.md     # thin map: pointers + durable workflow rules only (~tens of lines)
ARCHITECTURE.md           # SINGLE source of truth: stack, package/module layout, build/run/test, architectural conventions
docs/
  vision.md               # what we are building and why; scope (MVP vs future); decomposition into epics
  roadmap.md              # lightweight tracker: epics + status (todo/in-progress/done) + links. NOT an issue tracker
  conventions.md          # code style + commit conventions — how code is written & committed
  guidelines/             # reusable cross-cutting mechanics: how the framework/platform/tooling works (not unit-specific, not house style) — including the test harness & strategy
  specs/
    <axis>/               # one subdirectory per long-lived unit TYPE (components/, services/, domains/, features/, …); inside, one file per unit reflecting its CURRENT state. A focused project may need a single axis; a large system splits across several.
  tests/
    <axis>/               # mirrors specs/<axis>/ one-to-one: per-unit test-coverage matrix (what is automated vs verified live)
  designs/
    active/               # the design for the epic currently in progress
    completed/            # designs of shipped epics — no longer source of truth
  plans/
    active/               # the plan for the epic currently in progress
    completed/            # plans of shipped epics — no longer source of truth
```

Role of each file:

- **CLAUDE.md / AGENTS.md** — a map. Lists the docs above with a one-line pointer each, plus durable workflow/process rules (the per-epic cycle, documentation hygiene). Contains no architecture, code, or feature detail itself — those live in the linked docs.
- **ARCHITECTURE.md** — the only place for stack, layout, commands, and *architectural* conventions (how the project is built). Everything else links here.
- **docs/vision.md** — product intent and rationale; the document you return to when planning. Holds the epic breakdown.
- **docs/roadmap.md** — status of each epic and what's left. Subtasks live in the epic's plan, not here.
- **docs/conventions.md** — code and contribution conventions (style, language, commit format). The home for "how code is written and committed", so neither CLAUDE.md nor ARCHITECTURE.md restates them.
- **docs/guidelines/** — reusable, cross-cutting technical knowledge: how the underlying framework, platform, or tooling actually works (mechanics, gotchas, patterns) that no single unit owns. Distinct from `conventions.md` (how *we* write code); guidelines capture how the *platform* behaves. **The test harness and strategy live here too** — the test stack, what is automated vs verified live, and the patterns for each — because they are cross-cutting mechanics, not facts about one unit. A living source of truth, like the specs; registered as pointers from the map and pulled when implementing, not loaded by default.
- **docs/specs/\<axis\>/** — the system of record for each unit (e.g. a component's API + behavior + extension points). Organize into one or more subdirectories named after the longest-living unit *types* (`components/`, `services/`, `domains/`, `features/`, …): a focused project may use a single axis (e.g. `components/`), a large system splits across several. Each subdirectory holds one file per unit. Updated after every epic that touches the unit.
- **docs/tests/\<axis\>/** — mirrors `docs/specs/\<axis\>/` one-to-one: per-unit test-coverage matrix recording *what is checked and how* (automated unit/integration vs verified live). A separate file per unit, kept symmetric with the spec so the pair is easy to find. It records **gaps too** — behaviors not yet tested, each with a brief reason — so the matrix doubles as a test TODO and a long doc never creates a false sense that everything is covered. The reusable *how* of testing is not repeated here — it lives once in `docs/guidelines/`.
- **docs/designs/** — per-epic design docs (the brainstorm output: scope, decisions, rationale); `active/` while the epic runs, `completed/` once shipped. Mirrors `docs/plans/`. Authoritative only while in `active/` (see Principles).
- **docs/plans/** — per-epic implementation plans; `active/` while in progress, `completed/` once shipped.

Do NOT keep a single "current-state" snapshot file — current state is the sum of ARCHITECTURE.md + the durable specs, kept up to date.

**Spec vs guideline.** A spec records *what a unit is* — its API, behavior, and values. The reusable mechanics of the framework or platform behind it (the *how*) live in guidelines, never in a spec. The split is unit-fact vs framework-mechanic, **not** unique-vs-shared: if a statement's real subject is the framework/platform it is a guideline, but if its subject is the unit it stays in the spec — even behavior that several units share. This is what keeps one mechanic from being re-explained in every unit's spec.

**Spec vs test doc vs testing guideline.** Test knowledge splits the same way. *What is covered* for a unit — the matrix of behaviors and whether each is checked by an automated test or only live — is a unit-fact, so it lives in `docs/tests/<axis>/<unit>.md` (a separate file mirroring the spec, not a section inside it: it keeps specs lean and lets the two evolve independently). *How testing works* — the harness, the run command, the patterns, what is and isn't automatable — is a cross-cutting mechanic, so it lives once in `docs/guidelines/`. A test doc points at the testing guideline; it does not restate it. A test doc records gaps as first-class entries — behaviors not yet tested, marked as such with a brief reason — so it is also the TODO list for closing them; coverage and gaps live side by side, never in separate files.

### Example: a thin CLAUDE.md

A project-agnostic skeleton (placeholders in `<...>`). It shows the discipline: a map plus the durable Workflow and Documentation Hygiene rules, and nothing else.

```markdown
# <Project> — Guidance

Map of this repository's knowledge base. A table of contents, not an encyclopedia — read the linked docs for detail rather than duplicating it here.

## Documentation Map

- **ARCHITECTURE.md** — stack, layout, build/run/test, architectural conventions. How the project is *built*.
- **docs/conventions.md** — code style and commit conventions. How code is *written and committed*.
- **docs/guidelines/** — reusable cross-cutting mechanics: how the framework/platform works, plus the test harness & strategy. Pointers only; not loaded by default.
- **docs/vision.md** — what we are building and why; scope and rationale.
- **docs/roadmap.md** — the epic sequence and status. What is left to do.
- **docs/specs/<axis>/*.md** — current API/behavior of each unit. The system of record per unit.
- **docs/tests/<axis>/*.md** — per-unit test-coverage matrix (automated vs live), mirroring the specs.
- **docs/designs/** & **docs/plans/** — per-epic design and plan (`active/` → `completed/`).

## Workflow

- Each epic runs its own cycle: brainstorm → design (`docs/designs/active/`) → plan (`docs/plans/active/`) → execute → consolidate durable knowledge into `docs/specs/<axis>/*.md` and the test-coverage matrix into `docs/tests/<axis>/*.md` (and `docs/guidelines/` for reusable mechanics) → move design and plan to `completed/`.

## Documentation Hygiene

- Keep this file a thin map. Architectural facts → ARCHITECTURE.md; code/commit conventions → docs/conventions.md; product intent → docs/vision.md; unit state → docs/specs/<axis>/; unit test coverage → docs/tests/<axis>/; cross-cutting framework/platform mechanics (incl. the test harness) → docs/guidelines/. Don't duplicate here.
- A spec says *what a unit is*; the framework/platform mechanics behind it (the *how*) live in docs/guidelines/, not in a spec. Unit-fact vs framework-mechanic, not unique-vs-shared. The same split applies to tests: per-unit coverage → docs/tests/<axis>/; the test harness & strategy → docs/guidelines/. A test doc lists gaps too (not-yet-tested behaviors, with a reason), so it doubles as a TODO.
- After an epic touches a unit, update its durable spec and its test-coverage doc so both reflect reality.
- A design and plan stop being the source of truth once they move to `completed/`.
```

## Per-epic workflow

1. **Brainstorm** the epic (intent, constraints, approach) — one question at a time, present a design, get approval.
2. **Write the design** into `docs/designs/active/`, then the **plan** into `docs/plans/active/`.
3. **Execute** the plan.
4. **Consolidate** durable knowledge into `docs/specs/<axis>/*.md` (update the affected units to reflect reality) and the test-coverage matrix into `docs/tests/<axis>/*.md`, and record any reusable framework/platform mechanics discovered (including testing mechanics) into `docs/guidelines/`.
5. **Close the epic**: move the design and plan from `active/` to `completed/`; update `docs/roadmap.md` status. That move is the point they stop being the source of truth — they are not updated again.

Per-epic designs and plans share one date-slug (e.g. `YYYY-MM-DD-<epic>.md`, identical in both trees — the directory conveys the type, so no `-design`/`-plan` suffix). They are **kept, not deleted**: after the epic they stay in `completed/` as a point-in-time record. Reserve "spec" for the durable per-unit docs (the living source of truth); the brainstorm output is a "design", not a spec.

## Bootstrap steps for a fresh project

When applying this model to a new repo:

1. Establish `docs/vision.md` first (via a brainstorm): purpose, scope (MVP vs future), and an epic breakdown.
2. Create `ARCHITECTURE.md` (stack/layout/commands/architectural conventions) and `docs/conventions.md` (code style + commit conventions). Move such facts out of CLAUDE.md/AGENTS.md into whichever fits.
3. Reduce CLAUDE.md/AGENTS.md to a thin map of pointers + durable workflow rules.
4. Create `docs/roadmap.md` from the epics in the vision.
5. Create `docs/specs/<axis>/`, `docs/tests/<axis>/`, `docs/designs/active|completed/`, and `docs/plans/active|completed/` lazily, at the start of the first epic; create `docs/guidelines/` the first time a reusable framework/platform mechanic (including the test harness) is worth recording.
6. Retire any monolithic "current-state" doc into ARCHITECTURE.md + durable specs.
