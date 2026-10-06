# Operating Model, Lean Variant: Repository as System of Record for Code-Reading Agents

A lighter cut of the [operating model](operating-model.md) for projects whose agents read and search code faster than they read prose about it. It keeps what code cannot hold — intent, rationale, the increment in progress, and the handoff between sessions — and drops the documents that restate the code. It stands on its own; the full model remains the reference for the reasoning behind the rules the two share.

## Lean or full

- **Lean** when agents do most of the reading and writing, and the code with its tests describes itself well.
- **Full** when people review behavior without reading code, when units carry rules the code cannot make obvious, or when agents struggle to find their way around the codebase.
- Moving from full to lean mostly deletes documents; moving back means writing specs from the code, which an agent can do unit by unit.

## Principles

- **The repository is the system of record.** Decisions, intent, and current state live in versioned files; chat is disposable.
- **Code and tests are the source of truth for behavior.** No per-unit document restates what the code does. Test names are written as behavior statements and serve as the spec; known gaps are marked where they live (`it.todo`, `@Disabled("why")`, `pytest.mark.skip(reason=...)`), not in a coverage document.
- **Enforce, then point.** A rule tooling can check — types, lint, architecture tests — lives in the tooling; prose names the rule and where it is enforced.
- **Intent apart from facts.** `docs/vision.md` says what we set out to build; `ARCHITECTURE.md` says what exists and is written from the code. Their overlap is not duplication.
- **Facts apart from their why.** The rationale for significant choices is recorded once, append-only, in `docs/decisions/`.
- **One fact, one home.** Link instead of restating.
- **A fresh session per increment.** Each increment starts with a clean context; continuity travels through files, never through chat history.

## Document structure

```
CLAUDE.md / AGENTS.md          # thin map + workflow rules (a few dozen lines)
ARCHITECTURE.md                # what exists: layout, commands, invariants and where each is enforced
docs/
  vision.md                    # intent: what and why, scope, increment breakdown, intended architecture
  roadmap.md                   # increment status + backlog
  decisions/                   # append-only NNNN-<slug>.md
  increments/
    active/<YYYY-MM-DD-slug>/  # design.md + plan.md of the increment in progress
    completed/                 # history; never a source for current behavior
  guidelines/                  # on demand: mechanics the code does not make obvious
```

- **CLAUDE.md / AGENTS.md** — the map plus process rules: the increment cycle, the session protocol, the plan format, and the few conventions tooling cannot enforce (language, commit format, how much confirmation the user wants). No architecture or feature detail.
- **ARCHITECTURE.md** — written from the code. On day one it holds one line: `Status: nothing built yet; the intended stack and layout live in docs/vision.md.` Later it records layout, commands, and invariants, each with where it is enforced. An adopted convention is a fact even before all code complies; record it with the state of compliance beside it.
- **docs/vision.md** — the product as intent: purpose, scope, increments as descriptions (not status), and the intended architecture, which opens with `Intent, not current state; ARCHITECTURE.md is authoritative for what exists.` Updated when intent changes, never because code landed.
- **docs/roadmap.md** — status per increment and the backlog; nothing else.
- **docs/decisions/** — one short file per decision that is hard to reverse, counterintuitive, or likely to be re-litigated: Status, Context (with the alternatives rejected), Decision, Consequences. Written when the decision is acted on. The body never changes; the status may become `superseded by NNNN`.
- **docs/increments/** — `design.md` (scope, key decisions, acceptance) and `plan.md` (below) per increment, authoritative only while in `active/`.
- **docs/guidelines/** — created the first time a mechanic of the platform or the test harness is worth recording because the code alone does not make it obvious.

## What is left out, and why

| Full model | Lean variant | Why |
|---|---|---|
| `docs/specs/<axis>/`, one file per unit | the code | An agent reads the unit faster than a prose mirror of it, and the mirror drifts. |
| `docs/tests/<axis>/` coverage matrices | test names and in-file gap markers | The suite is the matrix; gaps sit next to the code they concern. |
| `docs/conventions.md` | formatter and linter configs, a few lines in the map | Configs are conventions that cannot drift. |
| Plans with full code for every step | plans with interfaces and acceptance checks | The executing agent writes the code once, in the code. |
| Consolidation into specs, test docs, guidelines, decisions, and `ARCHITECTURE.md` | `ARCHITECTURE.md`, decisions, roadmap | Fewer documents to keep in step after every increment. |

## The lean plan

A plan fixes *what* to build and *how to verify it*, never the code.

- **Header:** goal, architecture in two or three sentences, stack, a link to the design, and global constraints, one line each.
- **File map:** path → responsibility.
- **Tasks,** in order. Each states its intent, the files it touches, the interfaces it produces or consumes — exact names and types, the one place a plan is precise — and acceptance checks phrased as tests or commands with expected results. Checkboxes track progress.
- **`## Handoff`** at the end, at most ten lines: state, next step, gotchas. Rewritten before every session ends.

## Per-increment workflow

1. **Start fresh.** In a new session, read the map, the roadmap, and the increment's description in the vision.
2. **Design.** Write `docs/increments/active/<YYYY-MM-DD-slug>/design.md`: scope, key decisions, acceptance. Summarize it to the user in a few lines and get a go-ahead, as briefly as the map says the user wants.
3. **Plan.** Write `plan.md` beside it and set the roadmap status to in progress.
4. **Execute.** On a branch, one commit per task, checks green before anything is claimed. If the increment outgrows the session, rewrite the Handoff, commit, and continue in a new session.
5. **Close.** Write what changed into `ARCHITECTURE.md` from the code, record decisions that clear the bar, mark the roadmap entry done, move the directory to `completed/`, merge.

Fixes and chores skip the design and the plan, but not the close: if a fact or a decision changed, update `ARCHITECTURE.md` or add a decision in the same change.

## Session protocol

- **Start:** check the branch, read the roadmap, open the active `plan.md` at `## Handoff`.
- **End:** tick finished tasks, rewrite the Handoff, commit. Nothing the next session needs may live only in chat.

## Template: a lean CLAUDE.md

```markdown
# <Project> — Guidance

<One sentence on what the project is.> This file is a map plus workflow rules; detail lives in the linked docs, and code is the source of truth for behavior.

## Map

- `ARCHITECTURE.md` — what is built: layout, commands, invariants. Read it before changing code.
- `docs/vision.md` — what we are building and why: scope, increments, intended architecture. Read it before designing.
- `docs/roadmap.md` — increment status and backlog.
- `docs/decisions/` — why significant choices were made. Append-only; the filenames are the index.
- `docs/increments/active/<date-slug>/` — the increment in progress: `design.md` and `plan.md`. Never use `docs/increments/completed/` as a source for current behavior.
- `docs/guidelines/` — non-obvious mechanics, created on demand.

## Sources of truth

- Code and tests define behavior. There are no per-unit spec or coverage docs: read the code, treat test names as the behavior spec, and mark known gaps in the test files.
- Enforce rules in tooling rather than prose; docs only point to the rule.
- One fact, one home: link instead of restating.
- Intent lives in `docs/vision.md`; `ARCHITECTURE.md` records only what exists and is written from the code.

## Workflow

- One increment per fresh session; a large one may span several. Hand off through files, never through chat.
- Session start: check the branch, read `docs/roadmap.md`, then the active `plan.md` from its `## Handoff`.
- Starting an increment: write a short `design.md` (scope, key decisions, acceptance), summarize it to the user, write `plan.md`, set the roadmap status to in progress. <How much confirmation the user wants.>
- `plan.md` is lean: tasks with intent, files, interfaces, and acceptance checks — no code — ending with `## Handoff` (at most 10 lines), rewritten before a session ends.
- Execute on branch `<branch pattern>`, one commit per task; run the checks before claiming anything works.
- Closing an increment: update `ARCHITECTURE.md` from the code, add decisions that clear the bar (hard to reverse, counterintuitive, likely to be re-litigated), mark the roadmap entry done, move the increment to `completed/`, merge.
- Fixes and chores skip design and plan but still update `ARCHITECTURE.md` and decisions when a fact or decision changes.

## Conventions

- <Language, commit format, anything tooling cannot enforce.>
```

## Bootstrap

1. Brainstorm `docs/vision.md`: purpose, scope, increment breakdown, intended stack and layout.
2. Create `ARCHITECTURE.md` with its status line, `docs/roadmap.md` from the vision's increments, and the map from the template. Record adopting this variant as decision `0001`.
3. Create `docs/increments/active/` with the first increment, `completed/` when it closes, and `guidelines/` at first need.

**From the full model.** Keep the vision, roadmap, decisions, increments, and guidelines. Move whatever in `specs/` the code cannot make obvious into tests, code comments, or a guideline; delete `specs/`, `tests/`, and `conventions.md` once their remaining content has a home; trim the map to the template.

## With a skill flow

If the agent plans through a skill flow (for example superpowers: brainstorming → writing-plans → executing-plans), override its defaults in the map: designs and plans go to the increment directory, and plans follow the lean format rather than carrying full code.

## Monorepo

The full model's [monorepo variant](operating-model.md#monorepo-variant) applies without the documents this variant leaves out: product-level vision, roadmap, and decisions at the root; a map and `ARCHITECTURE.md` per subproject; an increment's documents follow its center of gravity.
