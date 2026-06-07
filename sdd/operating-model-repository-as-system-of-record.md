# Operating Model: Repository as System of Record (lightweight SDD)

Use this as the documentation and workflow model for the project. Goal: durable knowledge lives in the repository in a structured, deduplicated, progressively-disclosed form — so any session (human or agent) can pick up work without re-reading everything or re-deriving decisions. No heavy SDD tooling (no OpenSpec-style frameworks); the per-task plan/implement engine is whatever skill flow we already use, layered under a project-level doc structure.

## Principles

- **System of record is the repo, not chat.** Decisions, intent, and current state live in versioned docs, not in conversation history.
- **Table of contents, not encyclopedia.** The entry-point file is a thin map of pointers; detail lives in the documents it links to.
- **Progressive disclosure.** Start from a small stable entry point; follow links to deeper sources only when needed.
- **No duplication.** Every fact has exactly one home. Other docs link to it, never restate it.
- **Source of truth follows the work.** Long-lived knowledge (architecture, product intent, per-unit specs) is *maintained* to reflect reality and is always the source of truth. A per-epic design and plan are authoritative only while in `active/` — that is the work we are currently executing. Moving them to `completed/` is the moment they stop being the source of truth: they become history, are not updated again, and are expected to diverge from the code as it evolves. Don't consult a `completed/` design or plan for current behavior.

## Document structure

```
CLAUDE.md / AGENTS.md     # thin map: pointers + durable workflow rules only (~tens of lines)
ARCHITECTURE.md           # SINGLE source of truth: stack, package/module layout, build/run/test, architectural conventions
docs/
  vision.md               # what we are building and why; scope (MVP vs future); decomposition into epics
  roadmap.md              # lightweight tracker: epics + status (todo/in-progress/done) + links. NOT an issue tracker
  conventions.md          # code style + commit conventions — how code is written & committed
  <durable-specs>/        # one file per long-lived unit of the system, reflecting its CURRENT state
                          #   pick the axis that lives longest: components/ or services/ or domains/ or features/
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
- **docs/\<durable-specs\>/** — the system of record for each unit (e.g. a component's API + behavior + extension points). Updated after every epic that touches the unit.
- **docs/designs/** — per-epic design docs (the brainstorm output: scope, decisions, rationale); `active/` while the epic runs, `completed/` once shipped. Mirrors `docs/plans/`. Authoritative only while in `active/` (see Principles).
- **docs/plans/** — per-epic implementation plans; `active/` while in progress, `completed/` once shipped.

Do NOT keep a single "current-state" snapshot file — current state is the sum of ARCHITECTURE.md + the durable specs, kept up to date.

### Example: a thin CLAUDE.md

A project-agnostic skeleton (placeholders in `<...>`). It shows the discipline: a map plus the durable Workflow and Documentation Hygiene rules, and nothing else.

```markdown
# <Project> — Guidance

Map of this repository's knowledge base. A table of contents, not an encyclopedia — read the linked docs for detail rather than duplicating it here.

## Documentation Map

- **ARCHITECTURE.md** — stack, layout, build/run/test, architectural conventions. How the project is *built*.
- **docs/conventions.md** — code style and commit conventions. How code is *written and committed*.
- **docs/vision.md** — what we are building and why; scope and rationale.
- **docs/roadmap.md** — the epic sequence and status. What is left to do.
- **docs/<durable-specs>/*.md** — current API/behavior of each unit. The system of record per unit.
- **docs/designs/** & **docs/plans/** — per-epic design and plan (`active/` → `completed/`).

## Workflow

- Each epic runs its own cycle: brainstorm → design (`docs/designs/active/`) → plan (`docs/plans/active/`) → execute → consolidate durable knowledge into `docs/<durable-specs>/*.md` → move design and plan to `completed/`.

## Documentation Hygiene

- Keep this file a thin map. Architectural facts → ARCHITECTURE.md; code/commit conventions → docs/conventions.md; product intent → docs/vision.md; unit state → docs/<durable-specs>/. Don't duplicate here.
- After an epic touches a unit, update its durable spec so it reflects reality.
- A design and plan stop being the source of truth once they move to `completed/`.
```

## SDD workflow (per epic)

1. **Brainstorm** the epic (intent, constraints, approach) — one question at a time, present a design, get approval.
2. **Write the design** into `docs/designs/active/`, then the **plan** into `docs/plans/active/`.
3. **Execute** the plan.
4. **Consolidate** durable knowledge into `docs/<durable-specs>/*.md` (update the affected units to reflect reality).
5. **Close the epic**: move the design and plan from `active/` to `completed/`; update `docs/roadmap.md` status. That move is the point they stop being the source of truth — they are not updated again.

Per-epic designs and plans share one date-slug (e.g. `YYYY-MM-DD-<epic>.md`, identical in both trees — the directory conveys the type, so no `-design`/`-plan` suffix). They are **kept, not deleted**: after the epic they stay in `completed/` as a point-in-time record. Reserve "spec" for the durable per-unit docs (the living source of truth); the brainstorm output is a "design", not a spec.

## Bootstrap steps for a fresh project

When applying this model to a new repo:

1. Establish `docs/vision.md` first (via a brainstorm): purpose, scope (MVP vs future), and an epic breakdown.
2. Create `ARCHITECTURE.md` (stack/layout/commands/architectural conventions) and `docs/conventions.md` (code style + commit conventions). Move such facts out of CLAUDE.md/AGENTS.md into whichever fits.
3. Reduce CLAUDE.md/AGENTS.md to a thin map of pointers + durable workflow rules.
4. Create `docs/roadmap.md` from the epics in the vision.
5. Create `docs/<durable-specs>/`, `docs/designs/active|completed/`, and `docs/plans/active|completed/` lazily, at the start of the first epic.
6. Retire any monolithic "current-state" doc into ARCHITECTURE.md + durable specs.
