# Operating Model: Repository as System of Record (lightweight development harness)

Use this as the documentation and workflow model for the project — a lightweight harness for how work is captured, structured, and carried out across sessions. Goal: durable knowledge lives in the repository in a structured, deduplicated, progressively-disclosed form — so any session (human or agent) can pick up work without re-reading everything or re-deriving decisions. No heavy frameworks (no OpenSpec-style spec-driven-development tooling); the per-task plan/implement engine is whatever skill flow we already use, layered under a project-level doc structure.

**Scope.** This model governs durable project knowledge, work-state handoff, and the entry and exit invariants around an increment. It does not prescribe the task-execution engine, branching strategy, CI, code review, release process, or incident response. A project may choose those independently, provided they preserve the source-of-truth and consolidation rules below.

## Principles

- **System of record is the repo, not chat.** Decisions, intent, and current state live in versioned docs, not in conversation history.
- **Table of contents, not encyclopedia.** The entry-point file is a thin map of pointers; detail lives in the documents it links to.
- **Progressive disclosure.** Start from a small stable entry point; follow links to deeper sources only when needed.
- **One authoritative home.** Every durable fact has exactly one authoritative home. Other docs link to it; they may include a short contextual summary only when it is clearly derived and non-authoritative. The goal is to prevent competing answers, not to eliminate every repeated sentence. Intent and the fact it became are not one fact with two homes: `docs/vision.md` saying what we set out to build and `ARCHITECTURE.md` recording what is built will often read alike, and neither is a duplicate to delete — resolving that overlap by cutting from the vision is a misapplication of this rule.
- **Facts, not plans.** What the living source-of-truth docs (ARCHITECTURE.md, the specs) *describe* is what is already built and realized in code — never what is merely intended. A description that has not yet landed as code — the chosen stack, the planned layout, the intended contract — is still intent: it lives in vision/roadmap and in the active design/plan, and never leaks into the source of truth. A source-of-truth doc that has nothing to record yet stays nearly empty; that is correct, not a gap to backfill with placeholders or TODOs.
- **Source of truth follows the work.** At stable checkpoints, long-lived knowledge (architecture, product intent, per-unit specs, cross-cutting guidelines) is maintained and is the source of truth for its own question — the fact-bearing docs against reality, `docs/vision.md` against current intent. During an active increment, its branch or working tree is an intentional transition away from that stable baseline: the code is authoritative for what already runs there, while the increment's design and plan are authoritative for its scope, approach, and remaining work. Living fact docs may temporarily describe the last stable checkpoint until consolidation, but they must be reconciled before a completed change is integrated or the increment ships. When execution changes the agreed scope, interfaces, approach, or task sequence, update the active design or plan at the point of discovery rather than leaving the handoff stale. Once the roadmap gives an increment a terminal status, its design and plan become immutable history and must not be consulted for current behavior.
- **Facts live apart from their why.** Living docs record what the system is; the reasoning behind a significant choice — the context, the alternatives rejected, the trade-offs accepted — is recorded once, append-only, in `docs/decisions/`. A living doc links to the decision instead of restating the rationale, and a decision is never edited to match the present — it can only be superseded by a new one. This keeps rationale from silting up ARCHITECTURE.md, guidelines, and specs, and keeps "why is it like this" answerable long after the increment that decided it is archived.

## Document structure

```
AGENTS.md / CLAUDE.md     # one canonical thin map; additional tool-specific entry points point to it
ARCHITECTURE.md           # SINGLE source of truth: stack, package/module layout, build/run/test, architectural conventions
docs/
  vision.md               # what we are building and why; scope (MVP vs future); decomposition into increments
  roadmap.md              # authoritative increment status + sequence + future backlog. NOT an issue tracker
  conventions.md          # code style + commit conventions — how code is written & committed
  guidelines/             # reusable cross-cutting mechanics: how the framework/platform/tooling works (not unit-specific, not house style) — including the test harness & strategy
  decisions/              # append-only decision log: one file per significant decision — context, choice, rejected alternatives; only its status ever changes
  specs/
    <axis>/               # one subdirectory per long-lived unit TYPE (components/, services/, domains/, features/, …); inside, one file per unit reflecting its CURRENT state. A focused project may need a single axis; a large system splits across several.
  tests/
    <axis>/               # mirrors specs/<axis>/ one-to-one: per-unit assurance map (evidence, live checks, and gaps)
  increments/
    <date-increment>/      # one directory per started increment, holding its design.md + plan.md
```

Role of each file:

- **AGENTS.md / CLAUDE.md** — a map. Choose one canonical entry point for the project; any additional tool-specific instruction file contains only compatibility-specific instructions and a pointer to the canonical map, never a second copy of it. The canonical file lists the docs above with a one-line pointer each, plus durable workflow/process rules (the per-increment cycle, documentation hygiene). It is also the home for *process* facts — how the documentation is laid out and how work flows. It contains no architecture, code, or feature detail itself — those live in the linked docs.
- **ARCHITECTURE.md** — the only place for stack, layout, commands, and *architectural* conventions: how the **product** is built. Three disciplines: (1) it records what is **already built** — current facts, not plans or placeholders; on a fresh repo it stays nearly empty until real code lands, and that is correct rather than a gap to fill. The *intended* stack and architecture, chosen before any code exists, live in `docs/vision.md`; as each piece lands, the corresponding fact is written here **from the code** — never pre-populate this file with the planned stack. (2) It is about the **product, not the process** — how documentation is organized and how work flows belong in CLAUDE.md / AGENTS.md, not here. (3) It holds two kinds of content. **Descriptions** — stack, layout, commands, contracts — record what is realized in code; *Facts, not plans* governs them strictly. **Conventions** are normative rules, and are facts about what is **in force**: a convention is true once adopted, even where existing code predates it. Record the convention, and record the mixed reality beside it — which parts already comply, and the decision that set the direction. What is never recordable is a convention written as though compliance were already complete. Everything else links here.
- **docs/vision.md** — product intent and rationale; the document you return to when planning. Holds the scope (MVP vs future), the increment breakdown as **descriptions** — what each increment is and why, not their status — and the *intended* architecture (target stack, layout, and the contract between parts) — which stays here as intent even once built. Landing a piece of intent does not move it: at the consolidating increment's step 4 the fact is written into `ARCHITECTURE.md` **from the code**, an independent write, and the vision's own sentence stays. What the vision must not become is a second answer to "what exists": from the moment a piece lands, `ARCHITECTURE.md` is the only source for it, so the vision's architecture section opens with the frame `Intent, not current state; ARCHITECTURE.md is authoritative for what exists.` The vision is maintained on changes of **intent** — scope moved between MVP and future, increments added, split, or dropped, a target reconsidered — and never on code landing; a direction abandoned rather than realized is marked superseded in place, by the session that changes course, not deleted. The vision is authored before `docs/decisions/` exists and never depends on it — where a reversal earned a decision entry the superseded note may name it, but the vision must stay readable without the log.
- **docs/roadmap.md** — the authoritative **status** and sequence of each increment (the delivery tracker) plus the **future-development backlog** (out-of-scope ideas, kept so they are not lost). Allowed statuses are `todo`, `active`, `blocked`, `shipped`, `cancelled`, and `superseded by <increment>`. Increment descriptions live in `vision.md` and are not restated here; the backlog lives only here, never duplicated into the vision. Subtasks live in the increment's plan, not here.
- **docs/conventions.md** — code and contribution conventions (style, language, commit format). The home for "how code is written and committed", so neither CLAUDE.md nor ARCHITECTURE.md restates them.
- **docs/guidelines/** — reusable, cross-cutting technical knowledge: how the underlying framework, platform, or tooling actually works (mechanics, gotchas, patterns) that no single unit owns. Distinct from `conventions.md` (how *we* write code); guidelines capture how the *platform* behaves. **The test harness and strategy live here too** — the test stack, what is automated vs verified live, and the patterns for each — because they are cross-cutting mechanics, not facts about one unit. A living source of truth, like the specs; registered as pointers from the map and pulled when implementing, not loaded by default.
- **docs/decisions/** — the append-only decision log: one file per significant decision, `NNNN-<slug>.md` (the sequential number gives a short citable handle — "see decision 0007"), structured as Status / Context / Decision / Consequences, with the alternatives considered and why they lost inside Context or Decision. A third kind of document — neither living fact nor frozen history: the body is immutable, but the Status line changes over time (`accepted` → `superseded by 0012`). The bar for recording: the decision is hard to reverse, counterintuitive, or keeps getting re-litigated; routine choices don't get a file. Most entries are distilled out of an increment's design at consolidation; decisions made outside any increment (during a fix, a spike, an incident) are written directly. The design stays the full point-in-time record of its increment; the decision file is the topic-addressable extract that still binds after the design is archived. A decision is recorded when it is being acted on. A choice agreed but not yet implemented is still intent: until it lands it has no entry here — it lives in `vision.md`/`roadmap.md` and in the active increment's design. And a decision is never a source for current state — that is what the living docs are for.
- **docs/specs/\<axis\>/** — the system of record for each unit (e.g. a component's API + behavior + extension points). Organize into one or more subdirectories named after the longest-living unit *types* (`components/`, `services/`, `domains/`, `features/`, …): a focused project may use a single axis (e.g. `components/`), a large system splits across several. Each subdirectory holds one file per unit. Updated after every increment that touches the unit. Each spec opens with `Source:` — the code paths it describes. Freshness is not recorded in the file; it is resolved from history by the check in the template below. Where the code has moved past the spec the code wins, and refreshing the spec is part of the current change.
- **docs/tests/\<axis\>/** — mirrors `docs/specs/\<axis\>/` one-to-one: a per-unit assurance map recording meaningful behavior or risk and its evidence (automated unit/integration test, verified live, or not covered). It is not an inventory of every test file or test method; link representative evidence only where that helps someone reproduce the check. A separate file per unit keeps the spec lean and the pair easy to find. It records **gaps too**, each with a brief reason, so risk stays visible without implying that everything is covered. The reusable *how* of testing is not repeated here — it lives once in `docs/guidelines/`.
- **docs/increments/** — one directory per started increment, `YYYY-MM-DD-<increment>/`, holding two files: `design.md` (the brainstorm output: scope, decisions, rationale) and `plan.md` (the implementation plan). Deliberately two files, not one — executing the plan should not drag the whole design into context. The directory never moves: `docs/roadmap.md` is the single source of lifecycle status. Its design and plan are authoritative for work state only while the roadmap status is `active` or `blocked`; a terminal status freezes them as history (see Principles).

Do NOT keep a single "current-state" snapshot file. Current product architecture and behavior are the sum of `ARCHITECTURE.md` and the durable specs; current cross-cutting mechanics live in guidelines, contribution rules in conventions, and intent in vision. Together these maintained documents form the durable project knowledge base.

**Spec vs guideline.** A spec records *what a unit is* — its API, behavior, and values. The reusable mechanics of the framework or platform behind it (the *how*) live in guidelines, never in a spec. The split is unit-fact vs framework-mechanic, **not** unique-vs-shared: if a statement's real subject is the framework/platform it is a guideline, but if its subject is the unit it stays in the spec — even behavior that several units share. This is what keeps one mechanic from being re-explained in every unit's spec. The two directions are not equally costly. A framework mechanic left inside a spec is duplication: the next unit that needs it rediscovers it, and consolidation lifts it out. A unit fact promoted into a guideline is applied to units it was never true of — 'transactions reject zero amounts' becomes a rule a budget domain obeys, where zero is legitimate. When unsure, leave it in the spec.

**Spec vs assurance map vs testing guideline.** Test knowledge splits the same way. *What evidence exists* for a unit's meaningful behaviors and risks — automated, verified live, or missing — is a unit-fact, so it lives in `docs/tests/<axis>/<unit>.md` (a separate file mirroring the spec, not a section inside it: it keeps specs lean and lets the two evolve independently). Record behavior-level confidence, not a catalogue of individual test methods. *How testing works* — the harness, the run command, the patterns, what is and isn't automatable — is a cross-cutting mechanic, so it lives once in `docs/guidelines/`. An assurance map points at the testing guideline; it does not restate it. It records gaps as first-class entries, each with a brief reason, so evidence and risk live side by side rather than in separate TODO files.

**Fact vs decision.** A living doc records *what is*; a decision records *why it is that way*. When a choice lands, the resulting fact goes into the living docs — an architectural convention into ARCHITECTURE.md, a unit behavior into its spec, a platform mechanic into a guideline — and evolves with reality. The reasoning behind it — the context at the time, the alternatives rejected, the trade-offs accepted — goes into `docs/decisions/` and never evolves: when reality moves on, the fact is updated in place and the decision is superseded by a new entry, not rewritten. The living doc links to the decision for the why instead of restating it; the decision never serves as a source for current state. Example: "all money amounts are integer cents" is a fact — an architectural convention in ARCHITECTURE.md; *why cents rather than decimals*, and what was rejected, is its entry in `docs/decisions/`.

### Template: a thin agent map

A project-agnostic skeleton (placeholders in `<...>`). It shows the discipline: a map plus the durable Workflow and Documentation Hygiene rules, and nothing else. It is consumed at bootstrap — the adopting project writes its canonical agent instruction file from it and does not keep the template.

```markdown
# <Project> — Guidance

Map of this repository's knowledge base. A table of contents, not an encyclopedia — read the linked docs for detail rather than duplicating it here.

## Documentation Map

- **ARCHITECTURE.md** — stack, layout, build/run/test, architectural conventions. How the product is *built* (current facts, not plans).
- **docs/conventions.md** — code style and commit conventions. How code is *written and committed*.
- **docs/guidelines/** — reusable cross-cutting mechanics: how the framework/platform works, plus the test harness & strategy. Pointers only; not loaded by default.
- **docs/decisions/** — append-only log of significant decisions: context, choice, rejected alternatives. The *why* behind the facts.
- **docs/vision.md** — what we are building and why; scope and rationale; increment descriptions; **and the intended stack and layout, which stay here as intent even once built** — ARCHITECTURE.md records what exists separately, from the code. Updated when intent changes, not when code lands.
- **docs/roadmap.md** — the authoritative increment sequence and status, plus the future-development backlog. What is left to do and what state it is in.
- **docs/specs/<axis>/*.md** — current API/behavior of each unit. The system of record per unit.
- **docs/tests/<axis>/*.md** — per-unit assurance map (automated evidence, live checks, and gaps), mirroring the specs.
- **docs/increments/** — one immutable-location directory per started increment, with `design.md` + `plan.md`; lifecycle status lives only in the roadmap.

## Reading order

- **Always in context:** this map, and `ARCHITECTURE.md` — its conventions bind every change.
- **When resuming work:** read `docs/roadmap.md`, then the design and plan for the selected `active` or `blocked` increment; inspect the working tree and recent commits before choosing the next incomplete task.
- **When starting on a unit:** that unit's spec, plus a scan of `docs/decisions/` filenames for anything binding the area — the filenames *are* the index; there is no separate registry to maintain.
- **When designing:** `docs/vision.md` and the relevant `docs/guidelines/` **before** the design is fixed — not at implementation time, or the design will be built against constraints it never saw.
- **Never for current behavior:** the design or plan of an increment with a terminal roadmap status (`shipped`, `cancelled`, or `superseded`).

## Workflow

- Each increment runs its own cycle: brainstorm → design (`docs/increments/<date-slug>/design.md`) → plan (`plan.md` next to it) → set roadmap status to `active` → execute → consolidate durable knowledge into `docs/specs/<axis>/*.md`, assurance evidence into `docs/tests/<axis>/*.md`, any new architectural convention, layout change, or command into `ARCHITECTURE.md`, reusable mechanics into `docs/guidelines/`, significant decisions into `docs/decisions/` → set a terminal roadmap status.
- The roadmap is the single source of lifecycle state: `todo` becomes `active`, may move between `active` and `blocked`, and ends as `shipped`, `cancelled`, or `superseded by <increment>`. Terminal design and plan files are immutable history.
- Every design begins with `Touches:` naming the durable units and shared surfaces it may change. Increments with overlapping `Touches:` sets do not run in parallel.
- Work smaller than an increment (fixes, chores) skips the cycle, but not consolidation: if durable behavior changed, update the affected specs, assurance maps, and decisions as part of the same change.

## Documentation Hygiene

- Keep this file a thin map: every fact category has an authoritative home above. Contextual summaries must be clearly derived and must not become competing answers.
- A spec says *what a unit is*; the framework/platform mechanics behind it (the *how*) live in docs/guidelines/, not in a spec. Unit-fact vs framework-mechanic, not unique-vs-shared. **When unsure, leave it in the spec** — a mechanic left in a spec is duplication the next unit's consolidation lifts out, but a unit fact promoted into a guideline gets applied to units it was never true of. The same split applies to tests: per-unit assurance evidence → docs/tests/<axis>/; the test harness & strategy → docs/guidelines/. An assurance map lists material gaps too (not-yet-tested behaviors or risks, with a reason), but does not inventory every test method.
- After an increment touches a unit, update its durable spec and its assurance map so both reflect reality — or ARCHITECTURE.md, when the changed behavior is a project-wide convention that no single unit owns.
- Every spec opens with `Source:` — the code paths it describes. Freshness is resolved from history, from the repo root: `git log -1 --format=%H -- <spec file>` gives the baseline (nothing printed = not committed, so the check has not run), then `git log <baseline>..HEAD -- <source paths>` lists what moved since. Non-empty means the code has moved past the spec; the code wins, and updating the spec is part of the current change.
- Facts and their why live apart: a living doc links to the docs/decisions/ entry for rationale, never restates it. A decision file is never edited to match the present — supersede it with a new one. A decision is never a source for current state — that is what the living docs are for. The bar for getting a file at all: hard to reverse, counterintuitive, or keeps getting re-litigated; routine choices don't get one.
- An increment's design and plan stop being the source of truth once its roadmap status becomes terminal.
```

## Per-increment workflow

An **increment** is the unit of one cycle: a single coherent slice of work — a feature, a foundation, a refactor — small enough to take through one brainstorm→design→plan→execute pass and decomposed into tasks *inside its own plan*. It is **not** a multi-cycle container (the Agile "epic"); a milestone such as an MVP is a *set* of increments, each delivered on its own.

### Lifecycle, resume, and concurrency

`docs/roadmap.md` is the single source of increment lifecycle state. An increment moves from `todo` to `active`, may move between `active` and `blocked`, and ends as `shipped`, `cancelled`, or `superseded by <increment>`. A terminal increment is never reopened — create a new increment that links back to it instead. When an increment becomes blocked, its roadmap entry records the blocker and the condition that would unblock it.

Every design begins with a `Touches:` line naming the long-lived units and shared architecture or guideline surfaces it expects to change. Parallel increments are safe only when their `Touches:` sets do not overlap; otherwise serialize them or combine the work into one increment. This is an ownership rule for durable knowledge, not a prescribed branching strategy.

To resume an increment in a fresh session:

1. Read the canonical map and `ARCHITECTURE.md`.
2. Read `docs/roadmap.md` and select an `active` or `blocked` increment.
3. Read that increment's design and plan, then the relevant specs, decisions, and guidelines for the surfaces named by its `Touches:` line.
4. Inspect the working tree and recent commits; reconcile what actually changed with the plan before selecting the next incomplete task.
5. If execution diverged in scope, interfaces, approach, or task sequence, update the active design or plan before continuing.

### Cycle

1. **Brainstorm** the increment (intent, constraints, approach) — one question at a time, present a design, get approval.
2. **Open the increment** at `docs/increments/<YYYY-MM-DD-increment>/`: write `design.md` with its `Touches:` line, write `plan.md` beside it, and set the roadmap status to `active`.
3. **Execute** the plan. Keep completed tasks and material deviations current in the plan; update the design when its scope, constraints, or chosen approach change. The code in the active branch or working tree is authoritative there, while living fact docs may still describe the stable baseline.
4. **Consolidate** durable knowledge into `docs/specs/<axis>/*.md` (update the affected units to reflect reality) and assurance evidence into `docs/tests/<axis>/*.md`; record any reusable framework/platform mechanics discovered (including testing mechanics) into `docs/guidelines/`; distil significant decisions — with the alternatives they beat — into `docs/decisions/`; and any new architectural convention, layout change, or command into `ARCHITECTURE.md` — descriptions written **from the code** as it now stands — where `docs/vision.md` stated it as intent, that intent stays put; this is a fresh write, not a transfer.
5. **Close the increment.** To mark it `shipped`, first complete implementation verification and consolidation; a shipped increment must not merge or otherwise integrate before this step. To mark it `cancelled` or `superseded by <increment>`, record that outcome in the roadmap and account for partial work: remove it, leave it isolated, or consolidate any part intentionally kept. Any terminal transition freezes the design and plan as point-in-time history; they are not updated again.

An increment's directory carries the date-slug (`YYYY-MM-DD-<increment>/`); the files inside are always plain `design.md` and `plan.md` — the directory conveys which increment, the filename conveys the type. They are deliberately two separate files: a session executing the plan loads `plan.md` without dragging the whole design into context. They are **kept in place, not moved or deleted**: the roadmap carries lifecycle state, and a terminal increment's directory remains as a point-in-time record. Reserve "spec" for the durable per-unit docs (the living source of truth); the brainstorm output is a "design", not a spec.

### Work smaller than an increment

Bug fixes, chores, and small adjustments don't get the ceremony: no design, no plan, no roadmap entry. One step survives at every scale — **consolidation**. If the change touched durable behavior, update the affected spec and assurance map — **or `ARCHITECTURE.md`, when the changed behavior is a project-wide convention that no single unit owns** — and record the decision, if one was made, as part of the same change, whatever shape a "change" takes in the project's flow. The cycle scales down; the source of truth does not.

## Bootstrap steps for a fresh project

When applying this model to a new repo:

1. Establish `docs/vision.md` first (via a brainstorm): purpose, scope (MVP vs future), and an increment breakdown.
2. Record the intended stack, layout, and architecture in `docs/vision.md` (step 1) — before code exists these are intent, not facts. Create `ARCHITECTURE.md` as a near-empty file: it holds only what is **already built**, so on a fresh repo it stays almost empty and fills in as code lands — do not pre-populate it with the planned stack. Its day-one content is a single status line — `Status: nothing built yet; the intended stack and layout live in docs/vision.md` — which is a fact about the file's own state, not a placeholder, and keeps the map from dead-ending. Create `docs/conventions.md` with only the conventions already settled (language, commit format), thin otherwise. Move any such facts that accumulated in CLAUDE.md/AGENTS.md into whichever fits.
3. Choose one of CLAUDE.md/AGENTS.md as the canonical thin map of pointers + durable workflow rules — the template above is what that file should look like, tie-breakers included. Any additional tool-specific entry point contains only compatibility instructions and a pointer to the canonical map.
4. Create `docs/roadmap.md` from the increments in the vision.
5. Create `docs/specs/<axis>/`, `docs/tests/<axis>/`, and `docs/increments/` lazily, at the start of the first increment; create `docs/guidelines/` the first time a reusable framework/platform mechanic (including the test harness) is worth recording, and `docs/decisions/` the first time a decision clears the bar.
6. Retire any monolithic "current-state" doc into ARCHITECTURE.md + durable specs.

**Syncing a project against a newer revision of this model.** The project wins by default: a difference is adopted because someone decided to adopt it, never because the model is newer.

To adopt the single-status increment layout from an older `active/` + `completed/` layout, first record every increment's authoritative status in `docs/roadmap.md`, then flatten the increment directories into `docs/increments/<date-slug>/` in the same change and update the canonical agent map. Existing `completed/` entries normally become `shipped`; inspect the history and mark any cancelled or superseded work explicitly rather than inferring an outcome from its old location.

For a repository with multiple subprojects, see [Monorepo variant](#monorepo-variant) below — the same model, layered on two levels.

## Monorepo variant

The model above describes a single project. When one repository holds several subprojects — often with different stacks or languages — apply the same model on **two levels**, without duplicating facts between them. Everything else (the principles, the per-increment cycle, the spec/guideline split) is unchanged.

- **Product level (root):** facts true for the whole product. `docs/vision.md`, `docs/roadmap.md`, and a language-agnostic `docs/conventions.md` (commit format, language) live here, alongside the root canonical agent map. The root `ARCHITECTURE.md` carries only what is **shared**: the repository layout and the **contract between subprojects**. This is the one place the file's scope widens — from "how the product is built" to "how the subprojects fit together".
- **Subproject level:** each subproject is self-contained, with its own thin canonical agent map, its own `ARCHITECTURE.md` (that subproject's stack, layout, commands), and its own `docs/` — `specs/`, `tests/`, `guidelines/`, `decisions/`, and a per-language `conventions.md` for coding style. The root never restates these; it links down to them.
- **An increment's docs follow its center of gravity:** a cross-subproject or product-level increment keeps its directory in the **root** `docs/increments/`; an increment contained in one subproject keeps it under that subproject. Decisions follow the same rule — product-wide ones in the root `docs/decisions/`, subproject-local ones in the subproject's. Either way, consolidation writes durable knowledge into the relevant subproject's `specs/` and `tests/`.

**Bootstrap delta.** Bootstrap steps 1–4 run once at the root (vision, the shared `ARCHITECTURE.md`, the language-agnostic `conventions.md`, the root map, the roadmap). A subproject's own agent map, `ARCHITECTURE.md`, and `docs/` are created **lazily** — when that subproject is first built, typically by the increment that introduces it, not up front.
