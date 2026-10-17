# Operating Model: Repository as System of Record (lightweight development harness)

Use this as the documentation and workflow model for the project — a lightweight harness for how work is captured, structured, and carried across sessions. Goal: durable knowledge lives in the repository in a deduplicated, progressively-disclosed form, so any session (human or agent) can pick up work without re-deriving decisions. No heavy frameworks (no OpenSpec-style spec-driven-development tooling); the per-task plan/implement engine is whatever skill flow we already use, layered under a project-level doc structure.

The model assumes an agent that reads the code before acting and re-checks what a doc claims against it. Prose that restates the code is therefore pure cost: it fills context, takes time to maintain, and drifts. So the docs hold only what the code cannot. The previous, heavier revision is kept as [operating-model-obsolete.md](operating-model-obsolete.md).

**Scope.** This model governs durable project knowledge, work-state handoff, and the entry and exit rules around an increment. It does not prescribe the task-execution engine (including the format of designs and plans), branching strategy, coordination of increments that run in parallel, CI, review practice, release process, or incident response. A project may choose those independently, provided they preserve the source-of-truth and consolidation rules below.

## Principles

- **Write down only what the repository cannot tell.** Docs hold intent (the vision), the why behind choices (decisions), the state of unfinished work (the roadmap and the open increment), and rules that tooling does not enforce and the code does not show. Everything else is read from the code. Where the code has moved past a doc, the code wins and the doc is fixed in the same change.
- **System of record is the repo, not chat.** Decisions, intent, and current state live in versioned files, not in conversation history.
- **Table of contents, not encyclopedia.** The entry-point file is a thin map of pointers; detail lives in the documents it links to, read only when needed.
- **One authoritative home.** Every durable fact has exactly one home; other docs link to it rather than restate it. Intent and the fact it became are not one fact with two homes: `docs/vision.md` saying what we set out to build and `ARCHITECTURE.md` recording what is built will often read alike, and neither is a duplicate to delete.
- **Facts, not plans.** What the living docs (`ARCHITECTURE.md`, the specs) *describe* is what is already realized in code. The chosen stack, the planned layout, the intended contract are intent until they land: they live in the vision and the open increment, never in a living doc. A living doc with nothing to record yet stays nearly empty; that is correct, not a gap to fill with placeholders.
- **Enforce, then point.** A rule that tooling checks — formatter, linter, type checker, architecture tests — lives in the tooling; a doc at most names the rule and where it is enforced.
- **Facts live apart from their why.** Living docs record what the system is; the reasoning behind a significant choice — context, rejected alternatives, trade-offs — is recorded once, append-only, in `docs/decisions/`. Living docs link to it instead of restating it.
- **Source of truth follows the work.** During an open increment its code is authoritative for what already runs, and its design and plan for scope, approach, and remaining work; living docs may still describe the last stable state until consolidation, which happens before the change is integrated. When the increment closes, its design and plan are deleted: history lives in version control (the commits, or the merged pull request), not in the working tree, where a search would find it and mistake it for the present.

## Document structure

```
CLAUDE.md / AGENTS.md     # one canonical thin map; other tool-specific entry points point to it
ARCHITECTURE.md           # what is built: where things live, boundaries and invariants, non-obvious commands
docs/
  vision.md               # what we are building and why; scope (MVP vs future); increments; intended architecture
  roadmap.md              # authoritative increment status + sequence + future backlog
  conventions.md          # rules for writing and committing code that tooling does not enforce and the code does not show
  guidelines/             # project-specific mechanics of the platform and the test harness that the code does not make obvious
  decisions/              # append-only decision log: one file per significant decision
  reference/              # optional: dated external research the project relies on; frozen
  specs/
    <axis>/               # one subdirectory per long-lived unit type (components/, services/, features/, …); one file per unit: what it does
  increments/
    YYYY-MM-DD-<slug>/    # design.md + plan.md of an open increment; deleted when it closes
```

Role of each file:

- **CLAUDE.md / AGENTS.md** — a map. Choose one canonical entry point; any other tool-specific instruction file holds only compatibility instructions and a pointer to it, or is a symlink to it — never a second copy. The map lists the docs with a one-line pointer each, plus the durable workflow rules, and is the home for *process* facts: how the docs are laid out and how work flows. No architecture, code, or feature detail.
- **ARCHITECTURE.md** — how the product is built, written **from the code**: a bird's-eye map of where things live, the boundaries and invariants between parts (with where each is enforced, if it is), and the commands that are not obvious from the build files. Not an inventory of the stack or of every package — the build files and the tree already say that. It names areas and their roles, not the units inside them: a statement belongs only if it stays true when a class or file inside an area is added, renamed, or removed. A unit worth naming is named where it is described: a spec's `Source:` or a guideline. Architectural **conventions** are facts about what is in force: a convention is true once adopted, even where older code predates it, so record it with the state of compliance beside it — never as though compliance were complete. On a fresh repo the file holds one line: `Status: nothing built yet; the intended stack and layout live in docs/vision.md`. Process belongs in the map, not here.
- **docs/vision.md** — product intent: the scope (MVP vs future), the increments as descriptions (what each is and why, not their status), and the intended architecture, which stays here as intent even once built. Its architecture section opens with `Intent, not current state; ARCHITECTURE.md is authoritative for what exists.` The vision is updated when intent changes — scope moved, increments added, split, or dropped, a target reconsidered — and never because code landed. A direction abandoned rather than realized is marked superseded in place, not deleted. The vision never depends on the decision log.
- **docs/roadmap.md** — the authoritative status and sequence of each increment, plus the future-development backlog, which lives only here. Entries are short and structured; descriptions stay in the vision, subtasks in the plan, discussion in the design.
- **docs/conventions.md** — rules for writing and committing code that tooling does not enforce and the existing code does not consistently show: commit format, the language of artifacts, a rule just adopted that older code does not follow yet, a counterintuitive house rule. How much lands here depends on the stack and its tooling; style that a formatter or linter enforces is not restated. Created when the first such rule is settled.
- **docs/guidelines/** — project-specific mechanics of the framework, platform, or tooling that no single unit owns and the code does not make obvious: gotchas found the hard way, patterns that must be followed. Not a retelling of the framework's own documentation. The test harness and strategy live here too: how tests run and what can only be checked live. Registered as pointers from the map and read when implementing, not loaded by default.
- **docs/decisions/** — the append-only decision log: one file per significant decision, `NNNN-<slug>.md` (the number is a short citable handle — "see decision 0007"), structured as Status / Context / Decision / Consequences, with the rejected alternatives inside Context or Decision. The body never changes; only the Status does (`accepted` → `superseded by 0012`). The bar: hard to reverse, counterintuitive, or keeps getting re-litigated; routine choices get no file. A decision is recorded when it is acted on — a choice agreed but not yet implemented is still intent. It is never a source for current state.
- **docs/reference/** — optional: verified external research the project relies on but does not own, e.g. what a reference product's public API documents. Each file is dated and frozen; redone research supersedes it in a new file. Never a source for what the product does: a spec or an open design wins.
- **docs/specs/\<axis\>/** — one file per long-lived unit, grouped by unit type (a focused project may need a single axis). A spec describes **what the unit does**: its purpose, its behavior as its users — people or other code — see it, its contract, and the rules the code does not make obvious. Not how it is implemented. The test: a statement belongs in the spec only if it stays true after a refactor that preserves behavior. "A disabled button looks distinct and cannot take focus" passes; "the button's color comes from `--btn-color`" fails — it repeats the code. Each spec opens with `Source:`, the code paths it describes, and may end with **Not covered**: behaviors no automated test checks, each with a reason, including those verified only live. What the tests do cover is the test suite itself; the spec does not list it.
- **docs/increments/\<YYYY-MM-DD-slug\>/** — the work state of an open increment: `design.md` and `plan.md`, in whatever format the project's skill flow produces. They are authoritative while the roadmap status is `active` or `blocked` and are deleted when it becomes terminal.

Do not keep a single "current-state" snapshot file. Current architecture and behavior are the code, read through `ARCHITECTURE.md` and the specs.

**Spec vs guideline.** A spec records *what a unit is*; the reusable mechanics of the framework or platform behind it live in guidelines. The split is unit-fact vs platform-mechanic, **not** unique-vs-shared: if a statement's subject is the unit, it stays in the spec even when several units share the behavior. When unsure, leave it in the spec. A mechanic left in a spec is duplication that the next consolidation lifts out; a unit fact promoted into a guideline gets applied to units it was never true of — "transactions reject zero amounts" becomes a rule a budget domain obeys, where zero is legitimate.

**Fact vs decision.** When a choice lands, the resulting fact goes into its living home and evolves with reality; the reasoning goes into `docs/decisions/` and never evolves — when reality moves on, the fact is updated in place and the decision is superseded by a new entry. Example: "all money amounts are integer cents" is an architectural convention in `ARCHITECTURE.md`; *why cents rather than decimals*, and what was rejected, is its decision entry.

### Template: a thin agent map

A project-agnostic skeleton (placeholders in `<...>`). It is consumed at bootstrap — the adopting project writes its canonical agent instruction file from it and does not keep the template.

```markdown
# <Project> — Guidance

Map of this repository's knowledge base: pointers, not content. The docs hold only what the code cannot tell; read the code for everything else. Where the code has moved past a doc, the code wins and the doc is fixed in the same change.

## Documentation Map

- **ARCHITECTURE.md** — what is built: where things live, boundaries and invariants, non-obvious commands. Written from the code.
- **docs/conventions.md** — rules for writing and committing code that tooling does not enforce and the code does not consistently show.
- **docs/guidelines/** — non-obvious platform and test-harness mechanics. Read when implementing.
- **docs/decisions/** — append-only log of significant decisions and the alternatives they beat; only choices that are hard to reverse, counterintuitive, or keep getting re-litigated get a file. The filenames are the index.
- **docs/reference/** — dated external research; frozen. Never a source for what the product does.
- **docs/vision.md** — what we are building and why: scope, increments, and the intended architecture, which stays here as intent even once built. Updated when intent changes, not when code lands.
- **docs/roadmap.md** — increment status and sequence, plus the backlog.
- **docs/specs/<axis>/*.md** — what each unit does as its users see it, and what no test covers. Each opens with `Source:`, the code paths it describes.
- **docs/increments/<date-slug>/** — `design.md` + `plan.md` of an open increment; deleted when it closes.

## Reading order

- **Always:** this map and `ARCHITECTURE.md`.
- **Resuming:** `docs/roadmap.md`; pick an `active` increment (a `blocked` one only once its unblock condition holds, setting it back to `active`), read its design and plan, then the working tree and recent commits.
- **Starting on a unit:** its spec, and the `docs/decisions/` filenames for the area.
- **Designing:** `docs/vision.md` and the relevant guidelines, before the design is fixed.

## Workflow

- Increment cycle: brainstorm → `design.md` + `plan.md` in `docs/increments/YYYY-MM-DD-<slug>/` → roadmap `active` → execute → verify → consolidate → close.
- Statuses: `todo`, `active`, `blocked` (with its blocker and unblock condition), and the terminal `shipped`, `cancelled`, `superseded by <increment>`. A terminal increment is never reopened; start a new one.
- When execution changes scope, interfaces, approach, or task order, update the design or plan at once.
- Consolidate before integrating: specs for changed behavior, `ARCHITECTURE.md` for changed layout, boundaries, architectural conventions, or commands, guidelines for a non-obvious mechanic, and decisions that clear the bar.
- Close: set the terminal status and delete the increment's directory in the same change; its history stays in version control.
- A brainstorm that only decomposes work is not an increment: its intent goes to the vision, its increments to the roadmap as `todo`, and a convention it adopts to its home at once.
- Fixes, refactors, and chores skip design and plan but not consolidation.

## Documentation Hygiene

- A spec states what a unit does, not how: a statement belongs only if it survives a behavior-preserving refactor. Platform mechanics go to guidelines; when unsure, leave it in the spec.
- `ARCHITECTURE.md` maps areas and their roles, not the units inside them: a statement belongs only if it survives adding, renaming, or removing a class or file.
- Living docs describe what is built, never what is planned; nearly empty is correct until code lands.
- Rationale lives in `docs/decisions/`, and living docs link to it. A decision is superseded, never edited, and never a source for current state.
- Rules that tooling enforces are not restated in prose.
```

## Per-increment workflow

An **increment** is the unit of one cycle: a single coherent slice of work — a feature, a foundation — small enough to take through one brainstorm→design→plan→execute pass and decomposed into tasks inside its own plan. It is not a multi-cycle container (the Agile "epic"); a milestone such as an MVP is a *set* of increments. An increment is **open** while its roadmap status is `active` or `blocked`.

### Lifecycle and resume

`docs/roadmap.md` is the single source of increment lifecycle state. An increment moves from `todo` to `active`, may move between `active` and `blocked`, and ends as `shipped`, `cancelled`, or `superseded by <increment>`. A `blocked` entry records its blocker and the condition that would unblock it. A terminal increment is never reopened; later work on the same ground is a new increment.

Not everything in the roadmap is an increment entry. Work done outside any increment — preparation before the first one, or work that predates adopting this model — may be recorded as prose with no status. Work not yet decomposed is shown as exactly that: a roadmap section that says "no increments yet" is a fact, not a gap. The brainstorm that decomposes it is not an increment and produces no design or plan: its intent goes to `docs/vision.md`, its increments to the roadmap as `todo`, and a convention it adopts to its home at once.

To resume an increment in a fresh session:

1. Read the canonical map and `ARCHITECTURE.md`.
2. Read `docs/roadmap.md` and select an `active` increment. Select a `blocked` one only after confirming its unblock condition now holds and returning it to `active`.
3. Read its design and plan, then the specs and decisions for the units it changes.
4. Inspect the working tree and recent commits, reconcile them with the plan, and update the design or plan if execution diverged before choosing the next task.

### Cycle

1. **Brainstorm** the increment (intent, constraints, approach) and get approval of the design.
2. **Open the increment** at `docs/increments/YYYY-MM-DD-<slug>/`: `design.md` and `plan.md` beside it; set the roadmap status to `active`.
3. **Execute** the plan. Keep it current, and update the design when scope, constraints, or approach change.
4. **Verify** the implemented behavior with the project's test harness and any required live checks. Resolve failures before consolidating.
5. **Consolidate**, before integration: update the specs of units whose behavior changed, including their **Not covered**; write any new layout, boundary, architectural convention, or command into `ARCHITECTURE.md` from the code as it now stands — where the vision stated it as intent, that intent stays put, since this is a fresh write rather than a transfer; record a non-obvious mechanic in `docs/guidelines/`; and distil decisions that clear the bar, with the alternatives they beat, into `docs/decisions/`. This is the last chance to keep anything from the design: the next step deletes it.
6. **Close the increment.** Integrate once verification and consolidation are done, set the roadmap status to `shipped`, and delete the increment's directory — in the same change where the integration mechanism allows it, otherwise immediately after. To mark it `cancelled` or `superseded by <increment>`, first account for partial work — remove it, leave it isolated, or consolidate whatever is kept — then delete the directory the same way.

Reserve "spec" for the durable per-unit docs; the brainstorm output is a "design".

### Work smaller than an increment

Bug fixes, refactors, chores, and any change that alters no durable unit's behavior skip the ceremony: no design, no plan, no roadmap entry, however much reasoning they take. Consolidation still applies: if the change altered a unit's behavior or a project-wide convention, update its spec or `ARCHITECTURE.md`, and record a decision that clears the bar — in the same change. Working notes beyond that are scratch. The cycle scales down; the source of truth does not.

## Bootstrap steps

When applying this model to a repo — a fresh one, or one with code already in it:

1. Establish `docs/vision.md` first, via a brainstorm: purpose, scope (MVP vs future), the increment breakdown, and the intended stack, layout, and architecture — before code exists these are intent, not facts.
2. Create `ARCHITECTURE.md`. On a fresh repo it holds only the status line — a fact about the file's own state, not a placeholder; do not pre-populate it with the planned stack. Where code already exists, write it from the code on day one. Create `docs/conventions.md` only if rules that tooling does not enforce are already settled. Move any such facts that accumulated in CLAUDE.md/AGENTS.md into whichever fits.
3. Write the canonical thin map from the template above; any additional tool-specific entry point is a pointer to it or a symlink.
4. Create `docs/roadmap.md` from the increments in the vision. Work done before adoption gets no retroactive increments; record it as prose, if at all.
5. Create `docs/specs/<axis>/` and `docs/increments/` at the start of the first increment, and `docs/guidelines/`, `docs/decisions/`, and `docs/reference/` at first need. On an existing codebase specs are not backfilled: a unit gets one when an increment first touches it. The map lists every directory from day one; an entry for one that does not exist yet says so and when it will be created.
6. Retire any monolithic "current-state" doc into `ARCHITECTURE.md` and specs.

**Syncing a project against a newer revision of this model.** The project wins by default: a difference is adopted because someone decided to adopt it, never because the model is newer. Recorded layout changes and their adoption steps live under [Migrations](#migrations).

For a repository with multiple subprojects, see [Monorepo variant](#monorepo-variant).

## Monorepo variant

When one repository holds several subprojects — often with different stacks or languages — apply the same model on **two levels**, without duplicating facts between them.

- **Product level (root):** `docs/vision.md`, `docs/roadmap.md`, a language-agnostic `docs/conventions.md` (commit format, language), and the root canonical map. The root `ARCHITECTURE.md` carries only what is **shared**: the repository layout and the **contract between subprojects** — the one place the file's scope widens from "how the product is built" to "how the subprojects fit together".
- **Subproject level:** each subproject has its own thin map, its own `ARCHITECTURE.md`, and its own `docs/` — `specs/`, `guidelines/`, `decisions/`, and a `conventions.md` for the rules its own tooling does not enforce. The root never restates these; it links down to them.
- **An increment's docs follow its center of gravity:** a cross-subproject increment keeps its directory in the root `docs/increments/`, one contained in a subproject under that subproject. Decisions follow the same rule. Either way, consolidation writes into the relevant subproject's specs.

**Bootstrap delta.** Bootstrap steps 1–4 run once at the root. A subproject's map, `ARCHITECTURE.md`, and `docs/` are created lazily, typically by the increment that introduces the subproject.

## Migrations

### 2026-10-16: Docs hold only what the code cannot

For a project on the [previous revision](operating-model-obsolete.md). Steps 2 and 5 can also be done lazily, the next time an increment touches the unit or file.

1. For each `docs/tests/<axis>/<unit>.md`, move its gaps and live-only checks into a **Not covered** section at the end of the unit's spec; then delete `docs/tests/`.
2. Trim each spec to what the unit does: drop every statement that would not survive a behavior-preserving refactor.
3. For each increment with a terminal status, move anything still binding into its home — a decision, if it clears the bar — then delete its directory. The roadmap keeps its status.
4. Remove `Touches:` lines from roadmap entries and open designs; coordinating parallel increments is outside the model.
5. Trim from `ARCHITECTURE.md`, `docs/conventions.md`, and `docs/guidelines/` what the build files, the tree, the tooling, and the framework's own documentation already say.
6. Update the canonical map from the template.

### 2026-08-18: Single-status increment layout

For a project using `docs/increments/active/` and `docs/increments/completed/`, first record every increment's authoritative status in `docs/roadmap.md`, then flatten the increment directories into `docs/increments/YYYY-MM-DD-<slug>/` in the same change and update the canonical agent map. Existing `completed/` entries normally become `shipped`; inspect the history and mark any cancelled or superseded work explicitly rather than inferring an outcome from its old location.
