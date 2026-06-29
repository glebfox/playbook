# Operating Model: Repository as System of Record (lightweight development harness)

Use this as the documentation and workflow model for the project — a lightweight harness for how work is captured, structured, and carried out across sessions. Goal: durable knowledge lives in the repository in a structured, deduplicated, progressively-disclosed form — so any session (human or agent) can pick up work without re-reading everything or re-deriving decisions. No heavy frameworks (no OpenSpec-style spec-driven-development tooling); the per-task plan/implement engine is whatever skill flow we already use, layered under a project-level doc structure.

## Principles

- **System of record is the repo, not chat.** Decisions, intent, and current state live in versioned docs, not in conversation history.
- **Table of contents, not encyclopedia.** The entry-point file is a thin map of pointers; detail lives in the documents it links to.
- **Progressive disclosure.** Start from a small stable entry point; follow links to deeper sources only when needed.
- **No duplication.** Every fact has exactly one home. Other docs link to it, never restate it.
- **Facts, not plans.** The living source-of-truth docs (ARCHITECTURE.md, the specs) record what *is* — what is already built and realized in code — never what is intended or merely decided. A choice that has not yet landed as code — the chosen stack, the planned layout, the intended contract — is still intent: it lives in vision/roadmap and in the active design/plan, and never leaks into the source of truth. A source-of-truth doc that has nothing to record yet stays nearly empty; that is correct, not a gap to backfill with placeholders or TODOs.
- **Source of truth follows the work.** Long-lived knowledge (architecture, product intent, per-unit specs, cross-cutting guidelines) is *maintained* to reflect reality and is always the source of truth. A per-increment design and plan are authoritative only while in `active/` — that is the work we are currently executing. Moving them to `completed/` is the moment they stop being the source of truth: they become history, are not updated again, and are expected to diverge from the code as it evolves. Don't consult a `completed/` design or plan for current behavior.

## Document structure

```
CLAUDE.md / AGENTS.md     # thin map: pointers + durable workflow rules only (~tens of lines)
ARCHITECTURE.md           # SINGLE source of truth: stack, package/module layout, build/run/test, architectural conventions
docs/
  vision.md               # what we are building and why; scope (MVP vs future); decomposition into increments
  roadmap.md              # lightweight tracker: increments + status (todo/in-progress/done) + future backlog. NOT an issue tracker
  conventions.md          # code style + commit conventions — how code is written & committed
  guidelines/             # reusable cross-cutting mechanics: how the framework/platform/tooling works (not unit-specific, not house style) — including the test harness & strategy
  specs/
    <axis>/               # one subdirectory per long-lived unit TYPE (components/, services/, domains/, features/, …); inside, one file per unit reflecting its CURRENT state. A focused project may need a single axis; a large system splits across several.
  tests/
    <axis>/               # mirrors specs/<axis>/ one-to-one: per-unit test-coverage matrix (what is automated vs verified live)
  designs/
    active/               # the design for the increment currently in progress
    completed/            # designs of shipped increments — no longer source of truth
  plans/
    active/               # the plan for the increment currently in progress
    completed/            # plans of shipped increments — no longer source of truth
```

Role of each file:

- **CLAUDE.md / AGENTS.md** — a map. Lists the docs above with a one-line pointer each, plus durable workflow/process rules (the per-increment cycle, documentation hygiene). It is also the home for *process* facts — how the documentation is laid out and how work flows. Contains no architecture, code, or feature detail itself — those live in the linked docs.
- **ARCHITECTURE.md** — the only place for stack, layout, commands, and *architectural* conventions: how the **product** is built. Two disciplines: (1) it records what is **already built** — current facts, not plans or placeholders; on a fresh repo it stays nearly empty until real code lands, and that is correct rather than a gap to fill. The *intended* stack and architecture, chosen before any code exists, live in `docs/vision.md` and migrate here as the code lands — never pre-populate this file with the planned stack. (2) It is about the **product, not the process** — how documentation is organized and how work flows belong in CLAUDE.md / AGENTS.md, not here. Everything else links here.
- **docs/vision.md** — product intent and rationale; the document you return to when planning. Holds the scope (MVP vs future), the increment breakdown as **descriptions** — what each increment is and why, not their status — and the *intended* architecture (target stack, layout, and the contract between parts) until it is built and migrates to `ARCHITECTURE.md`.
- **docs/roadmap.md** — the **status** of each increment (the delivery tracker) plus the **future-development backlog** (out-of-scope ideas, kept so they are not lost). Increment descriptions live in `vision.md` and are not restated here; the backlog lives only here, never duplicated into the vision. Subtasks live in the increment's plan, not here.
- **docs/conventions.md** — code and contribution conventions (style, language, commit format). The home for "how code is written and committed", so neither CLAUDE.md nor ARCHITECTURE.md restates them.
- **docs/guidelines/** — reusable, cross-cutting technical knowledge: how the underlying framework, platform, or tooling actually works (mechanics, gotchas, patterns) that no single unit owns. Distinct from `conventions.md` (how *we* write code); guidelines capture how the *platform* behaves. **The test harness and strategy live here too** — the test stack, what is automated vs verified live, and the patterns for each — because they are cross-cutting mechanics, not facts about one unit. A living source of truth, like the specs; registered as pointers from the map and pulled when implementing, not loaded by default.
- **docs/specs/\<axis\>/** — the system of record for each unit (e.g. a component's API + behavior + extension points). Organize into one or more subdirectories named after the longest-living unit *types* (`components/`, `services/`, `domains/`, `features/`, …): a focused project may use a single axis (e.g. `components/`), a large system splits across several. Each subdirectory holds one file per unit. Updated after every increment that touches the unit.
- **docs/tests/\<axis\>/** — mirrors `docs/specs/\<axis\>/` one-to-one: per-unit test-coverage matrix recording *what is checked and how* (automated unit/integration vs verified live). A separate file per unit, kept symmetric with the spec so the pair is easy to find. It records **gaps too** — behaviors not yet tested, each with a brief reason — so the matrix doubles as a test TODO and a long doc never creates a false sense that everything is covered. The reusable *how* of testing is not repeated here — it lives once in `docs/guidelines/`.
- **docs/designs/** — per-increment design docs (the brainstorm output: scope, decisions, rationale); `active/` while the increment runs, `completed/` once shipped. Mirrors `docs/plans/`. Authoritative only while in `active/` (see Principles).
- **docs/plans/** — per-increment implementation plans; `active/` while in progress, `completed/` once shipped.

Do NOT keep a single "current-state" snapshot file — current state is the sum of ARCHITECTURE.md + the durable specs, kept up to date.

**Spec vs guideline.** A spec records *what a unit is* — its API, behavior, and values. The reusable mechanics of the framework or platform behind it (the *how*) live in guidelines, never in a spec. The split is unit-fact vs framework-mechanic, **not** unique-vs-shared: if a statement's real subject is the framework/platform it is a guideline, but if its subject is the unit it stays in the spec — even behavior that several units share. This is what keeps one mechanic from being re-explained in every unit's spec.

**Spec vs test doc vs testing guideline.** Test knowledge splits the same way. *What is covered* for a unit — the matrix of behaviors and whether each is checked by an automated test or only live — is a unit-fact, so it lives in `docs/tests/<axis>/<unit>.md` (a separate file mirroring the spec, not a section inside it: it keeps specs lean and lets the two evolve independently). *How testing works* — the harness, the run command, the patterns, what is and isn't automatable — is a cross-cutting mechanic, so it lives once in `docs/guidelines/`. A test doc points at the testing guideline; it does not restate it. A test doc records gaps as first-class entries — behaviors not yet tested, marked as such with a brief reason — so it is also the TODO list for closing them; coverage and gaps live side by side, never in separate files.

### Example: a thin CLAUDE.md

A project-agnostic skeleton (placeholders in `<...>`). It shows the discipline: a map plus the durable Workflow and Documentation Hygiene rules, and nothing else.

```markdown
# <Project> — Guidance

Map of this repository's knowledge base. A table of contents, not an encyclopedia — read the linked docs for detail rather than duplicating it here.

## Documentation Map

- **ARCHITECTURE.md** — stack, layout, build/run/test, architectural conventions. How the product is *built* (current facts, not plans).
- **docs/conventions.md** — code style and commit conventions. How code is *written and committed*.
- **docs/guidelines/** — reusable cross-cutting mechanics: how the framework/platform works, plus the test harness & strategy. Pointers only; not loaded by default.
- **docs/vision.md** — what we are building and why; scope and rationale; increment descriptions.
- **docs/roadmap.md** — the increment sequence and status, plus the future-development backlog. What is left to do.
- **docs/specs/<axis>/*.md** — current API/behavior of each unit. The system of record per unit.
- **docs/tests/<axis>/*.md** — per-unit test-coverage matrix (automated vs live), mirroring the specs.
- **docs/designs/** & **docs/plans/** — per-increment design and plan (`active/` → `completed/`).

## Workflow

- Each increment runs its own cycle: brainstorm → design (`docs/designs/active/`) → plan (`docs/plans/active/`) → execute → consolidate durable knowledge into `docs/specs/<axis>/*.md` and the test-coverage matrix into `docs/tests/<axis>/*.md` (and `docs/guidelines/` for reusable mechanics) → move design and plan to `completed/`.

## Documentation Hygiene

- Keep this file a thin map. Architectural facts → ARCHITECTURE.md; code/commit conventions → docs/conventions.md; product intent → docs/vision.md; unit state → docs/specs/<axis>/; unit test coverage → docs/tests/<axis>/; cross-cutting framework/platform mechanics (incl. the test harness) → docs/guidelines/. Don't duplicate here.
- A spec says *what a unit is*; the framework/platform mechanics behind it (the *how*) live in docs/guidelines/, not in a spec. Unit-fact vs framework-mechanic, not unique-vs-shared. The same split applies to tests: per-unit coverage → docs/tests/<axis>/; the test harness & strategy → docs/guidelines/. A test doc lists gaps too (not-yet-tested behaviors, with a reason), so it doubles as a TODO.
- After an increment touches a unit, update its durable spec and its test-coverage doc so both reflect reality.
- A design and plan stop being the source of truth once they move to `completed/`.
```

## Per-increment workflow

An **increment** is the unit of one cycle: a single coherent slice of work — a feature, a foundation, a refactor — small enough to take through one brainstorm→design→plan→execute pass and decomposed into tasks *inside its own plan*. It is **not** a multi-cycle container (the Agile "epic"); a milestone such as an MVP is a *set* of increments, each delivered on its own.

1. **Brainstorm** the increment (intent, constraints, approach) — one question at a time, present a design, get approval.
2. **Write the design** into `docs/designs/active/`, then the **plan** into `docs/plans/active/`.
3. **Execute** the plan.
4. **Consolidate** durable knowledge into `docs/specs/<axis>/*.md` (update the affected units to reflect reality) and the test-coverage matrix into `docs/tests/<axis>/*.md`, and record any reusable framework/platform mechanics discovered (including testing mechanics) into `docs/guidelines/`.
5. **Close the increment**: move the design and plan from `active/` to `completed/`; update `docs/roadmap.md` status. That move is the point they stop being the source of truth — they are not updated again.

Per-increment designs and plans share one date-slug (e.g. `YYYY-MM-DD-<increment>.md`, identical in both trees — the directory conveys the type, so no `-design`/`-plan` suffix). They are **kept, not deleted**: after the increment they stay in `completed/` as a point-in-time record. Reserve "spec" for the durable per-unit docs (the living source of truth); the brainstorm output is a "design", not a spec.

## Bootstrap steps for a fresh project

When applying this model to a new repo:

1. Establish `docs/vision.md` first (via a brainstorm): purpose, scope (MVP vs future), and an increment breakdown.
2. Record the intended stack, layout, and architecture in `docs/vision.md` (step 1) — before code exists these are intent, not facts. Create `ARCHITECTURE.md` as a near-empty placeholder: it holds only what is **already built**, so on a fresh repo it stays almost empty and fills in as code lands — do not pre-populate it with the planned stack. Create `docs/conventions.md` with only the conventions already settled (language, commit format), thin otherwise. Move any such facts that accumulated in CLAUDE.md/AGENTS.md into whichever fits.
3. Reduce CLAUDE.md/AGENTS.md to a thin map of pointers + durable workflow rules.
4. Create `docs/roadmap.md` from the increments in the vision.
5. Create `docs/specs/<axis>/`, `docs/tests/<axis>/`, `docs/designs/active|completed/`, and `docs/plans/active|completed/` lazily, at the start of the first increment; create `docs/guidelines/` the first time a reusable framework/platform mechanic (including the test harness) is worth recording.
6. Retire any monolithic "current-state" doc into ARCHITECTURE.md + durable specs.

For a repository with multiple subprojects, see [Monorepo variant](#monorepo-variant) below — the same model, layered on two levels.

## Monorepo variant

The model above describes a single project. When one repository holds several subprojects — often with different stacks or languages — apply the same model on **two levels**, without duplicating facts between them. Everything else (the principles, the per-increment cycle, the spec/guideline split) is unchanged.

- **Product level (root):** facts true for the whole product. `docs/vision.md`, `docs/roadmap.md`, and a language-agnostic `docs/conventions.md` (commit format, language) live here, alongside the root `CLAUDE.md` map. The root `ARCHITECTURE.md` carries only what is **shared**: the repository layout and the **contract between subprojects**. This is the one place the file's scope widens — from "how the product is built" to "how the subprojects fit together".
- **Subproject level:** each subproject is self-contained, with its own thin `CLAUDE.md`, its own `ARCHITECTURE.md` (that subproject's stack, layout, commands), and its own `docs/` — `specs/`, `tests/`, `guidelines/`, and a per-language `conventions.md` for coding style. The root never restates these; it links down to them.
- **Designs and plans follow the increment's center of gravity:** a cross-subproject or product-level increment keeps its design/plan in the **root** `docs/designs|plans/`; an increment contained in one subproject keeps them under that subproject. Either way, consolidation writes durable knowledge into the relevant subproject's `specs/` and `tests/`.

**Bootstrap delta.** Bootstrap steps 1–4 run once at the root (vision, the shared `ARCHITECTURE.md`, the language-agnostic `conventions.md`, the root map, the roadmap). A subproject's own `CLAUDE.md`, `ARCHITECTURE.md`, and `docs/` are created **lazily** — when that subproject is first built, typically by the increment that introduces it, not up front.
