# Operating Model: Repository as System of Record (lightweight SDD)

Use this as the documentation and workflow model for the project. Goal: durable knowledge lives in the repository in a structured, deduplicated, progressively-disclosed form — so any session (human or agent) can pick up work without re-reading everything or re-deriving decisions. No heavy SDD tooling (no OpenSpec-style frameworks); the per-task plan/implement engine is whatever skill flow we already use, layered under a project-level doc structure.

## Principles

- **System of record is the repo, not chat.** Decisions, intent, and current state live in versioned docs, not in conversation history.
- **Table of contents, not encyclopedia.** The entry-point file is a thin map of pointers; detail lives in the documents it links to.
- **Progressive disclosure.** Start from a small stable entry point; follow links to deeper sources only when needed.
- **No duplication.** Every fact has exactly one home. Other docs link to it, never restate it.
- **Durable vs disposable.** Long-lived knowledge (architecture, product intent, per-unit specs) is maintained; task-scoped working docs are disposable and deleted/archived after the work ships.

## Document structure

```
CLAUDE.md / AGENTS.md     # thin map: pointers + durable workflow rules only (~tens of lines)
ARCHITECTURE.md           # SINGLE source of truth: stack, package/module layout, build/run/test, durable conventions
docs/
  vision.md               # what we are building and why; scope (MVP vs future); decomposition into epics
  roadmap.md              # lightweight tracker: epics + status (todo/in-progress/done) + links. NOT an issue tracker
  <durable-specs>/        # one file per long-lived unit of the system, reflecting its CURRENT state
                          #   pick the axis that lives longest: components/ or services/ or domains/ or features/
  plans/
    active/               # the plan for the epic currently in progress
    completed/            # archived plans of shipped epics
```

Role of each file:

- **CLAUDE.md / AGENTS.md** — a map. Lists the docs above with a one-line pointer each, plus durable workflow rules (commit convention, etc.). Contains no architecture or feature detail itself.
- **ARCHITECTURE.md** — the only place for stack, layout, commands, and conventions. Everything else links here.
- **docs/vision.md** — product intent and rationale; the document you return to when planning. Holds the epic breakdown.
- **docs/roadmap.md** — status of each epic and what's left. Subtasks live in the epic's plan, not here.
- **docs/\<durable-specs\>/** — the system of record for each unit (e.g. a component's API + behavior + extension points). Updated after every epic that touches the unit.
- **docs/plans/** — per-epic implementation plans; `active/` while in progress, `completed/` once shipped.

Do NOT keep a single "current-state" snapshot file — current state is the sum of ARCHITECTURE.md + the durable specs, kept up to date.

## SDD workflow (per epic)

1. **Brainstorm** the epic (intent, constraints, approach) — one question at a time, present a design, get approval.
2. **Write the plan** into `docs/plans/active/`.
3. **Execute** the plan.
4. **Consolidate** durable knowledge into `docs/<durable-specs>/*.md` (update the affected units to reflect reality).
5. **Archive**: move the plan to `docs/plans/completed/`; update `docs/roadmap.md` status. Delete disposable design scratch.

Dated task-scoped specs (e.g. `YYYY-MM-DD-<topic>-design.md`) are disposable — fine as working scratch, deleted once their content is consolidated into durable docs.

## Bootstrap steps for a fresh project

When applying this model to a new repo:

1. Establish `docs/vision.md` first (via a brainstorm): purpose, scope (MVP vs future), and an epic breakdown.
2. Create `ARCHITECTURE.md` as the single source for stack/layout/commands/conventions. Move any such facts out of CLAUDE.md/AGENTS.md.
3. Reduce CLAUDE.md/AGENTS.md to a thin map of pointers + durable workflow rules.
4. Create `docs/roadmap.md` from the epics in the vision.
5. Create `docs/<durable-specs>/` and `docs/plans/active|completed/` lazily, at the start of the first epic.
6. Retire any monolithic "current-state" doc into ARCHITECTURE.md + durable specs.
