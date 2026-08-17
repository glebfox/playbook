# Review — `skeptic` (adversarial)

Artifact: `harness/operating-model.md` (129 lines, ~3,100 words, ~5.2k tokens). Repo: `/Users/gorelov/Developer/Other/playbook`. Post-debate final position; 3 rounds with `advocate` and `practitioner`.

## 1. VERDICT

Right direction, and better thought-through than most doc conventions. The real contribution is not the folder list but a **three-class lifecycle taxonomy**: living docs updated in place, `completed/` increments frozen and *expected* to diverge, decisions immutable-with-mutable-status. That answers a resuming agent's only real question — "can I trust this file?" — from directory position rather than content, and it is genuinely ahead of monolithic-CLAUDE.md and memory-bank practice.

**Biggest strength:** maintenance is attached to a work-cycle *event* rather than to discipline, and it survives down to a bugfix.

**Biggest liability:** that event is unverified, and the archiving rule turns a skipped consolidation from "incomplete docs" into "confidently wrong docs plus a rule-forbidden record of the truth." Two of the three lifecycle classes are mechanically checkable (`is the path under completed/?`, read the Status line); the living class — the one you actually read for current behaviour — has no staleness signal at all. Runner-up, which all three reviewers converged on independently: **`ARCHITECTURE.md` is the destination of last resort for every fact no unit owns, and it is named in zero of the four write paths.** It is called the "SINGLE source of truth" (line 19), and the example map provides no route to the stack when it is empty. Orphaned on both the write and the read side.

The fix list is short and every defect is one clause wide — which is itself evidence the structure is sound. Nothing below enlarges the model.

## 2. FINDINGS

### F1 (HIGH) — Consolidation is unverified; the living tier has no staleness signal; and the archiving rule points away from the only accurate record.

**Claim.** Step 4 (line 98) carries the model's entire value. Step 5 (line 99) then moves the increment to `completed/`, and Principle line 12 states, in bold, "Don't consult a `completed/` design or plan for current behavior." Skip step 4 and you get: roadmap says done, spec silently predates the increment, and the only surviving record of what actually happened is *rule-forbidden as a source*. Nothing gates the close on consolidation having occurred; nothing makes the omission visible in a diff.

**Why it matters.** The one failure strictly worse than not having the model. Without a spec an agent greps code and is merely slow; with a stale spec it is confidently wrong and stops looking — and the model's own "SINGLE source of truth" framing (line 19) is what earns that misplaced trust.

**Sharpened by the debate, three ways.**
- `advocate`'s own defence supplies the deeper version: it argued the `completed/` rule is uniquely valuable because it is "*mechanically* checkable — a string test, not a judgment." Decisions are too (the Status line). But a living spec reconciled at increment 3 and one reconciled at increment 9 are byte-indistinguishable. The taxonomy is **2/3 mechanical, 1/3 faith, and the faith third is the class you read for current behaviour.**
- `practitioner` ran the scenario (increment 6 skips consolidation, discovered at increment 9): the stale spec is "internally consistent, undated, and confident," discovery probability without reading code is **zero**, and line 12 has no suspected-stale exception. Verdict: "your S1 is confirmed and understated."
- `practitioner`'s amplifier, the nastiest mechanism found in this review: **the gap list disguises the miss.** Line 45 makes test docs record explicit not-covered rows, so a behaviour *absent* from the table reads as "not implemented" rather than "not documented." A good feature actively camouflages consolidation failures.

**Evidence.** Lines 98–99; Principle line 12; line 105 ("One step survives at every scale — **consolidation**") with no verification anywhere. Repo confirms zero enforcement surface: no CI config, no git hooks, no lint, and the doc never mentions an automated check.

**Status: confirmed by both.** `advocate` pre-conceded ("Biggest liability in the artifact; I won't defend its absence") and proposed a plan-time "Consolidation targets" section — good ergonomics, insufficient as a fix: it is a *prediction*, nothing verifies it, and **it cannot exist for sub-increment work at all**, since line 105 grants "no design, no plan" to the path that carries most changes over a project's life. `advocate` conceded that hole as decisive. Fix is E1.

### F2 (HIGH) — `ARCHITECTURE.md` is orphaned on both sides: no step writes it, and nothing routes to it when it is empty.

**Write side.** `ARCHITECTURE.md` appears in 15 lines of the doc and in **none** of the four passages describing consolidation: line 98 (step 4), line 79 (example Workflow bullet), line 80 (sub-increment consolidation), line 105 ("Work smaller than an increment"). All four enumerate specs → test docs → guidelines → decisions and stop. Line 48 makes the file half of current state; line 38 makes the intended stack "migrate here as the code lands." No step owns that migration and no event triggers it.

**Read side (`practitioner`).** Example map line 67 routes stack → `ARCHITECTURE.md`; map line 71 describes `vision.md` as "what we are building and why; scope and rationale; increment descriptions" and never mentions the *intended stack*. So a day-2 agent asked "what's the stack" follows the map to a one-line file with no onward pointer. Commit `90f5b49` moved pre-code stack intent into `vision.md` and did not update the example map — progressive disclosure fails on day 2 for the single most-asked question.

**Two compounding wording defects.** (i) Move-vs-copy is never stated: line 10 ("every fact has exactly one home") *determines* that migration is a move, but the doc doesn't say it and an agent won't derive it under pressure — the copy reading leaves two stacks documented, one going stale. (ii) `practitioner`'s catch: bootstrap step 2 (line 112) calls `ARCHITECTURE.md` "a near-empty **placeholder**" while line 11 forbids "**placeholders**." Same word, opposed senses, 100 lines apart.

**Compound form (agreed by all three in round 3, and the sharpest statement of it).** F2 and F8 are one defect, not two: **`ARCHITECTURE.md` is the destination of last resort for every fact no unit owns — cross-unit contracts, non-unit code, architectural conventions — and it is named in zero of the four write paths.** `practitioner`'s money-rounding scenario is the proof: an agent following line 105 literally has nowhere legal to write the fact it just created.

**Severity: HIGH**, and by `advocate`'s own frame (cost-of-error, with facts-not-plans named the expensive class) the highest-cost defect in the artifact, since the orphaned file is precisely the one whose staleness produces broken code. **Status: `advocate` independently verified the line count and fully conceded; `practitioner` calls it its own biggest finding.** Fix is E2.

### F3 (HIGH) — No read discipline. The damage is decision amnesia, not context bloat.

**Claim.** "Progressive disclosure" is Principle line 9, but the entire read-side surface is four scattered fragments — line 12 (a prohibition), line 39 (vision is planning-time), lines 42/69 (guidelines are lazy), line 101 (plan not design). None answers "I'm starting on unit X — what enters context?"

**Reframed after `practitioner` corrected me.** I opened arguing unmeasured cost. That axis does not bite: a measured 13-file brainstorm read is **7,096 tokens = 3.5% of a 200k window**. Reads are cheap. The real damage is twofold:
- **Decision amnesia.** A leaner but equally compliant session reads 5 files, never opens `docs/decisions/`, and re-litigates a binding decision. The tier that exists specifically to stop an agent re-opening a closed question has no rule that causes it to be opened.
- **Design-time blindness**, which is sharper. Lines 42/69 say guidelines are "pulled when implementing, not loaded by default." So a *compliant* brainstorm designs `practitioner`'s CSV import blind to the Next.js node-vs-edge runtime gotcha that invalidates the design. The read-path gap breaks the front of the cycle, not just recall at the back.

Secondary: the model's claimed edge over memory-bank patterns — cost scaling with the task rather than with total project knowledge — is a *consequence of a read path* the artifact never operationalizes. `advocate` conceded claiming an unearned benefit and rates F3 a bigger gap than F2 ("S2 is a missing clause; S3 is a missing half").

**Severity: HIGH** (structural, ~5 lines to fix). **Status: conceded by both.** Fix is E5.

### F4 (MED-HIGH) — The deployed artifact is a lossy compression with no link back to its source.

**Claim.** What lands in a project is not this 129-line doc; it is the 29-line CLAUDE.md skeleton (lines 60–89, ~770 tokens) — the only doc with a per-*turn* cost. I measured the compression: the skeleton carries roughly **30% of the adjudication wording by volume**. The rules that do the actual adjudicating — spec-vs-guideline's "NOT unique-vs-shared" clause, fact-vs-decision, the "significant decision" bar, the already-built discipline, the increment definition — live in a doc in a *different repository*. `practitioner`: the example map has **no pointer to the operating model itself**, and nothing anywhere says to vendor it. On day 40 the project holds a lossy compression with no way to resolve ambiguity.

**Compounding.** The skeleton encodes the same routing table twice — the map (lines 65–75) and hygiene bullet 1 (line 84) — roughly 2× duplication inside the artifact that exists to demonstrate "no duplication." And bootstrap step 5 creates five directories lazily while the example map already lists all five as pointers, so on day 1 five of nine pointers resolve to nothing and nothing says "register in the map when created." Ship dead pointers or omit them and never re-add: a coin flip, `practitioner`'s wording.

**Why it matters.** This is the enforceability question answered concretely. There is no linter, no CI, no hook — the only thing holding the model together is the skeleton's prose, and the doc never says which sentences must be copied verbatim or that the source should be vendored at `docs/operating-model.md`.

**Severity: MED-HIGH. Status: found independently by `practitioner`; promoted on its evidence.** Fix is E10.

### F5 (HIGH, raised from MED) — No vocabulary for mid-migration or mid-increment state, which is the state a codebase spends most of its life in.

**Claim.** Line 11: living docs record "what is already built and realized in code … never what is intended or **merely decided**." Take a `services/` → `adapters/` split, 3 of 8 modules moved. The clause a fresh session most needs is **"new work follows the new pattern"** — and that is verbatim "merely decided," therefore banned. So a compliant agent records nothing directive, and the next session writes module 4 the old way.

**`practitioner`'s scenario (d) is why this is HIGH, not MED.** Mid-increment, the Layout block in `ARCHITECTURE.md` still says `services/`-only, which is *knowably* wrong, and step 4 puts the fix at the end. Increment 3 took 5–6 sessions; **4 of 6 ran against a deliberately-stale source of truth.** The interior of an increment is where most solo-dev sessions live, so the stale state is the common case, not the edge.

**Where I lost half of this.** `advocate` reframed: line 11 does *not* forbid the descriptive statement "A and B use P; C uses Q" — a complete present-tense truth. Correct, and I overstated. But routing the directive clause to `ARCHITECTURE.md` as a convention collides with line 38's gate ("**already built** — current facts, not plans or placeholders"), so a clause is needed, not just a worked example.

**Resolved in round 3 — `advocate`'s diagnosis beats both of ours, and I adopt it.** The collision exists because the doc never distinguishes two content types already present in `ARCHITECTURE.md`. **Descriptions** (stack, layout, commands, contracts) must be realized in code; line 11 governs them strictly and should not be weakened. **Conventions** are normative rules — facts about what is *in force*, true from adoption, not falsified by non-compliant legacy code. Proof the model already relies on this without saying it: line 54's own worked example, "all money amounts are integer cents," is called a **fact** and assigned to `ARCHITECTURE.md` — and that is a rule, not a description of code. Naming the distinction legalizes the clause a fresh session needs while leaving line 11 intact for the class where it does its expensive work.

**Status: confirmed and raised by `practitioner`; half-refuted then jointly resolved with `advocate`.** Fix is E4 (rewritten to `advocate`'s form). On the mid-increment half, `advocate` adds a fair point I accept: consolidation-at-close means mid-increment staleness is *by design*, and it is harmful only while undetectable — E1's marker converts it from failure to annoyance.

### F6 (MED) — The sub-increment path drops the cheap artifacts and keeps the expensive one.

**Claim (`practitioner`'s reframe, which replaces my weaker fan-out argument).** Line 105 grants "no design, no plan, no roadmap entry" — the three *cheapest* artifacts, and the ones you were going to think through anyway. It keeps the *expensive* part: deciding which of five tiers each fact belongs to. It optimizes the wrong half of the cost.

**Measured.** A one-line money-rounding change (half-down → half-up) reads 1,790 tokens and writes 2–3 doc files: a **4:1 doc-file-to-code-line ratio**. A `retryPolicy` option: 4–5 files, doc-to-code file ratio 1:1. Full increment: 12 files + 1 `git mv`, of which ~4 are pure bookkeeping.

**Compounding, and independent confirmation of F2.** `lib/money.ts` is not a "long-lived unit type," so it may own no spec at all; "money rounds half-up at the presentation boundary" is an architectural convention → `ARCHITECTURE.md` → which line 105 never mentions. Also unassigned: who sets roadmap status to *in-progress*? Step 5 covers only close.

**Severity: MED.** Note this is a cost *shape* problem, not a cost *magnitude* problem — I conceded the magnitude claim (see §4). **Status: `practitioner`'s finding; adopted.**

### F7 (MED) — The `<axis>` taxonomy is chosen at maximum ignorance, has no registry, and no rule against forking a second spec.

**Claim.** Bootstrap step 5 (line 115) creates `docs/specs/<axis>/` "lazily, at the start of the first increment" — before the system exists. Line 27 offers `components/ services/ domains/ features/` with no tie-break, and `auth` defensibly fits three.

**Refined by `practitioner`, correcting me.** Findability is *fine* — `ls docs/specs/*/` is cheap and a later session will locate the file. The real failure is **duplicate creation**: nothing says "list existing axes before creating a spec." And the deeper hole is that there is **no home for the axis registry** — it is a process fact (line 37 → CLAUDE.md), yet the example map ships `<axis>` unfilled in three places.

**Severity: MED. Status: `advocate` pre-conceded ("a generalization 95% of projects don't need"); `practitioner` confirmed with the refinement.** Unanimous: default to flat `docs/specs/`. I add that splitting into axes renames every spec path — exactly line 43's "hard to reverse" — so it should require a decision file. Fix is E9.

### F8 (LOW-MED, downgraded) — Facts that no unit owns have no stated home.

**Claim, reframed after `practitioner` mostly refuted the original.** I opened on unit-to-unit contracts; `practitioner` wrote the actual spec and the dichotomy at line 50 held — the cross-unit invariant "importKey is unique per account when non-null" landed on `specs/domains/transaction.md` without hesitation, because **the owner is whoever enforces it**. That tie-break is better than my finding and I concede the case.

**What survives is wider and came out of `practitioner`'s own S3 scenario:** the orphan class is not "contracts" but **facts no unit owns** — a genuinely ownerless bidirectional contract (a shared event schema), *and* non-unit code like `lib/money.ts` that isn't a "long-lived unit type" and therefore owns no spec file at all. Line 50 is a strict framework-vs-unit dichotomy with no third branch, so these facts have zero legal homes rather than two ambiguous ones — meaning `advocate`'s general defence ("mis-filing is cheap, the next consolidation lifts it out") does not apply: nothing lifts out a fact that was never written.

**Evidence the author already knows the answer:** line 124 gives exactly this concept a home one level up — root `ARCHITECTURE.md` "carries only what is **shared**: the repository layout and the **contract between subprojects**," called "the one place the file's scope widens." One clause replicates it inside a single project.

**Severity: LOW-MED. Status: `advocate` fully conceded; `practitioner` mostly refuted and I defer to the scenario over the concession.** Fix is E6.

## 3. PROPOSED EDITS

Ordered by value per line spent. Line numbers refer to the current file.

**E1 — ADD: source-anchored reconcile markers on living per-unit docs.** New paragraph after line 48. (Wording is `advocate`'s improvement on mine; credit to it.)

> **Reconcile markers.** Every living per-unit doc opens with two lines:
> ```
> Source: src/retry/**, src/http/client.ts
> Reconciled: 0009-retry-policy (a1b2c3d)
> ```
> Consolidation updates them. This is the model's only mechanical staleness check, and it involves no judgment: `git log a1b2c3d..HEAD -- src/retry/**` returning anything means the code has moved past this doc — trust the code, verify, and re-reconcile as part of whatever change you are making.

*Cost:* two lines per spec, updated during a step already opening the file. *Buys:* converts the living class from faith to a string comparison, completing the lifecycle taxonomy; reaches the sub-increment path that no plan-time list can (a bugfix touching `src/retry/**` without bumping the marker becomes detectable with no plan document anywhere); and partly fixes F3, since a spec that names its own source paths makes "load the spec" actionable. Prior art: freshness / last-reviewed stamps in docs-as-code practice (g3doc-style `freshness` blocks) exist for exactly this and are CI-checkable later if wanted. **Highest-value edit in this review; ranked above every tier boundary we argued.**

**E2 — REWORD line 98 (step 4) to include `ARCHITECTURE.md`, and add the read route + move semantics.**

> 4. **Consolidate** durable knowledge, in this order: architectural facts that now exist in code → `ARCHITECTURE.md`; per-unit behaviour → `docs/specs/<axis>/*.md`; coverage gaps → `docs/tests/…`; reusable framework/platform mechanics → `docs/guidelines/`; significant decisions, with the alternatives they beat → `docs/decisions/`. Update the reconcile marker on every living doc you touched. A destination needing no change is a valid outcome — but say so; it is a decision, not an omission.

Mirror the `ARCHITECTURE.md` clause into lines 79, 80, 86 and 105. Add at line 39 (`advocate`'s wording): *"as each part lands, the corresponding intent is **moved** — not copied — out of `vision.md` into `ARCHITECTURE.md`; `vision.md` keeps only what is still unbuilt."* Add to the example map's `vision.md` line (71): *"…and the intended stack and architecture until it is built."* Replace "near-empty **placeholder**" at line 112 with "near-empty file" to kill the word collision with line 11.

*Cost:* ~4 lines across 6 sites. *Buys:* the highest-cost-of-error file stops being orphaned on either side.

**E3 — REWORD line 99 (step 5) to make skipping consolidation visible.**

> 5. **Close the increment.** The move to `completed/` is the *last* action, after consolidation. On the roadmap entry, record what was reconciled — `reconciled: specs/services/http-client, decisions/0007` — or the explicit `reconciled: none — no durable behaviour changed`. Then move the directory and set the status. (Status moves to *in-progress* at step 2, when the increment's directory is created.)

*Cost:* one line per increment in `roadmap.md`. *Buys:* an omission becomes a visible absence in a diff instead of silence; closes the unassigned in-progress transition. Complements `advocate`'s plan-time "Consolidation targets" section — predict at plan time, record at close, detect at read time via E1.

**E4 — ADD one clause legalizing partially-realized state.** Both reviewers ruled the collision real; they proposed different insertion points and either suffices. Cheapest high-value edit in the list.

*Option A — add to Principle line 11* (`practitioner`'s wording; it holds the deciding vote, and this version stays strictly present-tense so *Facts, not plans* survives verbatim):

> A partially-realized state is itself a fact and is recorded as one: name both shapes, say which parts are in which, and state which one new code must use.

*Option B — add to line 38 instead, leaving line 11 untouched* (`advocate`'s wording, which names a distinction the doc already relies on):

> `ARCHITECTURE.md` holds two kinds of content. **Descriptions** — stack, layout, commands, contracts — record what is realized in code; the *Facts, not plans* principle governs them strictly. **Conventions** are normative rules and are facts about what is **in force**: a convention is true once adopted, even where existing code predates it. Record the convention, and record the mixed reality beside it — which parts already comply, and the decision that set the direction.

*Cost:* one sentence (A) or one paragraph (B). *Buys:* removes the case where the rules compel silence about the single most important thing a fresh session needs, and makes the mid-increment interior — where most sessions live — legally documentable. Line 54's "integer cents" example already depends on this distinction, so either edit names an existing practice rather than adding a rule.

**E5 — ADD a read path, in the CLAUDE.md skeleton (lines 77–88), not only in the playbook body.** (`advocate`'s two amendments: put it where it is actually injected; the negative half does the work.)

> ## What a session loads
> - Starting work on a unit: this map + that unit's spec (its `Source:` line tells you which files). Add its test doc when touching tests, `ARCHITECTURE.md` when layout/stack/commands matter, and the relevant `docs/decisions/` entry before changing anything a decision settled.
> - Brainstorming or designing: also pull the guideline for any mechanic in play — a design written blind to a platform constraint is the expensive failure, not a long read.
> - **Do not load:** `vision.md` / `roadmap.md` (planning only), any `completed/` increment (history only), the whole `guidelines/` tree (pull only the mechanic in play).

*Cost:* ~6 lines, in the per-turn artifact — **and it is self-funding.** `advocate`'s per-turn framing plus `practitioner`'s measurements make the budget explicit: CLAUDE.md is charged per *turn* (884 tokens measured × ~60 turns), so brevity is a genuine resource constraint for this one file and an aesthetic preference for every other. Cutting the duplicated routing table at line 84 (~150 tok/turn, per E10) pays for a reading order (~90 tok/turn) with change left over. *Buys:* fixes decision amnesia and design-time blindness; makes the model's claimed advantage over memory-bank patterns real rather than incidental.

**E6 — ADD to the spec-vs-guideline paragraph (line 50): a third branch for ownerless facts.**

> A fact whose subject is neither the platform nor one unit needs a stated owner. If two units share an invariant, it belongs to **whichever one enforces it**, with a link from the other. If it is genuinely ownerless — a bidirectional contract, or a shared library that is not a unit of any axis — record it as an architectural convention in `ARCHITECTURE.md`, the same rule the monorepo variant applies to the contract between subprojects.

*Cost:* one sentence. *Buys:* no orphan facts; "owner = enforcer" is a real tie-break (`practitioner`'s, derived by writing the spec) rather than a judgment call.

**E7 — CUT the `docs/tests/<axis>/` mirror tree; co-locate verification state inside each spec.** (`practitioner`'s final ruling, per its round-3 message to `advocate`: "skeptic's central `gaps.md` loses… Still one section, one file." Unanimous.) Replace the tier with one section per spec:

> ## Verification
> Per behaviour, one of three states: `automated` · `live-only` · `not verified (reason)`.

**The argument that actually carries this is `practitioner`'s, not mine.** Writing both files for one unit, the spec listed 7 behaviours + 3 invariants and the test doc listed 12 rows *restating the same facts in different words* — because you cannot hang coverage off a behaviour without restating the behaviour. **The mirrored tree structurally forces a violation of line 10, the model's own top rule.** The tier is not merely redundant; it is non-compliant with the model containing it. `advocate`'s amendment, which both of us missed: "verified live" is not *not covered* — it is covered, unautomated — hence three states rather than a gap list. Also ADD `advocate`'s clarifying sentence near line 45 or 52:

> A recorded *absence* — "B has no automated test", "C is verified live only" — is a present fact stated negatively, and is legal in a living doc. A recorded *intention* — "B will be covered" — is not.

*Cost:* one destination and one file per unit removed; forfeits line 52's asserted "evolve independently" property. *Buys:* removes the model's only self-inflicted duplication. Note the carve-out sentence is a **clarification, not a contradiction fix** — see §4.

**E8 — REWORD line 43's bar; ADD a legal recovery path to line 12.**

> …the decision is hard to reverse, counterintuitive, or draws a boundary a future session would plausibly re-open.

and, appended to line 12 (`advocate`'s formulation, which unblocks two claims at once):

> A `completed/` increment remains the legitimate record of *why-at-the-time* and of what that increment did; line 12's prohibition is on using it as a source for **current behaviour**, nothing else. When a living doc is suspected stale or a settled boundary is being re-opened, the archived design — and `git log` — is the best available record of intent. Read it as history, verify against the code, never copy it forward as fact.

*Cost:* two sentences. *Buys:* the bar becomes applicable when it is actually applied, and F1's recovery path stops being prohibited. Line 101 already calls the archive a "point-in-time record," so this makes an existing intent explicit rather than adding a rule.

**E9 — REWORD lines 27/44/115: flat by default, and check before creating.**

> Default to a flat `docs/specs/` — one file per unit. Split into typed subdirectories (`components/`, `services/`, `domains/`) only when a flat directory is genuinely hard to navigate; the split renames every existing spec path, so record it as a decision. Before creating a spec, list what exists (`ls docs/specs/`) — a unit gets exactly one file, and the axes in use are named in the map.

*Cost:* removes a generalization; loses nothing for a focused project. *Buys:* deletes a 2am judgment call and the fork-a-second-spec failure; gives the axis registry a home.

**E10 — ADD to the bootstrap steps: vendor the model, and register lazily-created directories.**

> 7. Copy this document into the project as `docs/operating-model.md` and point the map at it. The map is a lossy compression of these rules; when a session cannot tell where a fact belongs, it needs the full text in-repo, not in another repository.
> 8. When a lazily-created directory first appears (`guidelines/`, `decisions/`, `specs/`, `tests/`, `increments/`), add its pointer to the map in the same change. Until then the map does not list it — a pointer that resolves to nothing teaches a session that pointers are unreliable.

Also: cut the routing duplication in the example skeleton — the map (lines 65–75) and hygiene bullet 1 (line 84) encode the same table twice. Keep the map; reduce line 84 to "Keep this file a thin map — route facts to the homes listed above, don't restate them here."

*Cost:* one file copied at bootstrap, ~3 lines. *Buys:* the only answer to "what actually holds this together" — the adjudication rules become resolvable in-repo. Removes ~10 lines of self-duplication from the artifact demonstrating no-duplication.

### Is the small version better? — the honest answer

Weaker than my opening claim, and I lost this argument on the numbers. I opened saying a much smaller harness captures 80% at 20% of the cost. Two corrections landed. `advocate`: routing a fact is paid once per fact with the routing table in view, so **tier count is not the cost driver**, and collapsing tiers reintroduces the per-turn CLAUDE.md tax the thin-map rule exists to avoid. `practitioner`: a measured 13-file brainstorm read is 3.5% of a 200k window, so **read cost is not the problem either**.

The defensible cut is therefore narrow: **10 destinations → 8** (drop `docs/tests/<axis>/` entirely per E7, drop `<axis>` nesting per E9), plus **add three mechanisms** (E1 marker, E5 read path, E10 vendoring). That is roughly 70–80% of the current cost, not 20% — and I would rather claim 70% honestly than 20% and be wrong. What actually needs shrinking is not the structure but the *judgment per change* (F6): the sub-increment path should route by a fixed table, not by re-deriving five tier boundaries.

Cuts I considered and rejected: collapsing `vision.md`/`roadmap.md` (churn isolation is real — status changes every close, intent rarely, and merging puts constant diff noise on the doc you read for planning; `advocate` offered to trade this and I declined), and dropping the `active/` → `completed/` `git mv` (see §4).

## 4. WHAT I WAS WRONG ABOUT

- **"Cost is the problem."** `practitioner` measured it: 7,096 tokens for a full increment brainstorm read = 3.5% of window; 4:1 doc-to-code *file* ratio on a one-line fix but trivial token cost. Reads are cheap. F3's damage is **decision amnesia and design-time blindness**, not bloat; F6's is cost *shape*, not magnitude. My whole cost/benefit axis was reframed by it, and its framing is better.
- **The line 45 / line 11 contradiction — dead, 2–0.** I claimed the test tier's gap list violates the ban on TODOs in source-of-truth docs. `advocate` and `practitioner` independently supplied the same distinction: a recorded *absence* is a present fact stated negatively; line 11 bans inventing content for facts that are not yet true. Withdrawn. The carve-out in E7 is a clarification, not a fix.
- **`docs/tests/` is pure duplication** — right conclusion, wrong reason, and I got there by the weak route. My argument was derivability (coverage is reproducible from test files). The real argument is `practitioner`'s: coverage cannot be expressed without restating the behaviour, so the mirrored tree *structurally forces* a line 10 violation — 7 behaviours in the spec became 12 restating rows in the test doc. I also under-modelled the residue: "verified live" is covered-but-unautomated, not a gap, so it needs three states, not a gap list (`advocate`).
- **Unit-to-unit contracts have no home** — mostly wrong. `practitioner` wrote the spec and line 50 held: **the owner is whoever enforces it.** F8 survives only in the wider form its own scenario produced (`lib/money.ts` owns no spec because it is not a unit type). I take the scenario over `advocate`'s full concession.
- **Specs become unfindable under axis ambiguity** — wrong. `ls docs/specs/*/` is cheap. The failure is duplicate *creation*, not lost findability (`practitioner`).
- **Cut the `active/` → `completed/` `git mv`** — refuted by `advocate`, and correctly: positional authority is checkable from a path with zero failure points, versus locate-roadmap → name-match → trust-currency, three failure points under imperfect instruction-following. Withdrawn — and its argument is what produced F1's strongest form, since the living tier is the one place the model didn't do this.
- **The decision bar is broken** — over-claimed. It is a three-way disjunct and two clauses are prospective; `practitioner`'s `importKey` decision fires on "hard to reverse" with zero retrospection. Downgraded to a wording fix (E8) and dropped as a standalone finding.
- **Line 11 forbids recording mixed state** — half wrong. `advocate`: "A and B use P; C uses Q" is a legal present-tense statement. I overstated; F5 now rests on the *directive* clause and the line 11 / line 38 collision, which stands.
- **The 80/20 claim** — corrected to ~70–80%. See §3.
- Killed before sending: "the doc is too long" (5.2k tokens, paid once at adoption; the per-turn artifact is 770 tokens) and "prose rules can't bind an LLM" (that is the ambient CLAUDE.md baseline, not a defect of this model).

## 5. OPEN DISAGREEMENTS

Little survives. Two contested points closed in round 3:

- **Gap-register granularity — RESOLVED, unanimous.** I first proposed one central `gaps.md`, `advocate` a per-unit register, `practitioner` initially "keep the tier, cut the derivable half." Its final ruling cut the mirrored tree and co-located verification state in the spec as one section. All three now agree. (I mis-recorded its interim position when writing to `advocate`; corrected here.)
- **F5, collision or missing example — RESOLVED in my favour.** `practitioner` ruled the collision real ("a rule about what to *add*, not a description of what exists — internal collision, not a missing example") and `advocate` conceded. Residual is cosmetic: `practitioner` would add the clause to line 11, `advocate` to line 38. Either works; see E4.

Genuinely still open:

- **Does a plan-time "Consolidation targets" list suffice for F1?** `advocate`: targets-list plus marker. Me: marker first, targets optional — the list is a prediction, nothing verifies it, and line 105 exempts sub-increment work from having a plan at all. Low stakes; both are cheap and compatible.
- **How much mid-increment staleness is acceptable.** `advocate`: staleness inside an increment is by design (consolidation is at close) and harmful only while undetectable, so E1 suffices. Me + `practitioner`: with 4 of 6 sessions running against a knowingly-wrong Layout block, detectability is necessary but I would also want the convention writable at the *start* of the increment (E4), not only reconciled at the end.
- **The `vision.md` / `roadmap.md` split.** `advocate` offered to trade it as its weakest defended rule; I declined on its own churn-isolation reasoning. The only disagreement left is that neither of us will make the cut the other offered.

**Where all three of us converged:** F1, F2 (in its compound form), F3, F7's flat default, and E7's co-location. The three-class lifecycle taxonomy is the artifact's real contribution; the per-*turn* cost argument for the thin map is the strongest justification in the model; and every defect we found is one clause wide — which, as `advocate` fairly notes, is a point *for* the direction: several of these defects are the model's own rules violated by its own example, and they were findable only because the rules are precise enough to violate.
