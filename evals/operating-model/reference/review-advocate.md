# Review — advocate (defending reviewer)

Artifact: `harness/operating-model.md` (129 lines) in `/Users/gorelov/Developer/Other/playbook`.
Frame: primary consumer is an LLM session with a finite context window and imperfect instruction-following; primary maintainer is one developer plus agents.
Panel: `advocate` (this document), `skeptic`, `practitioner` (deciding vote). Three rounds completed.

---

## 1. VERDICT

The direction is right, and the git history is the evidence: commit #3 renamed *away* from SDD framing, #7 **merged** two parallel trees (`designs/` + `plans/`) into one `increments/`, #6 tightened "already built and decided" into "realized in code" — trims and tightenings, with `guidelines/` and `decisions/` added only after a specific leak was observed. Its single biggest strength is a **three-class lifecycle taxonomy** — living / frozen / append-only-with-mutable-status — which answers a resuming agent's only real question ("can I trust this file?") from a path or a status string without opening the file; `practitioner` measured this keeping ~24 files permanently out of the read set at increment 12, via a rule checkable with `ls`. Its single biggest liability is one compound write-side defect: **`ARCHITECTURE.md` is the de-facto second always-load file and the destination of last resort for every fact no unit owns, yet it is named in zero of the four places the model describes consolidation** (L79, L80, L98, L105) — so a compliant agent that discovers an architectural convention during a bugfix has nowhere legal to write it. Compounding it, the living tier has **no trust signal at all**: a spec reconciled five increments ago is byte-indistinguishable from one reconciled yesterday, making the taxonomy two-thirds mechanical and one-third faith with the faith third load-bearing. Both are fixable by adding one name to four lists and one two-line header per living doc — which is why they damage details, not the direction. Note for the record: `practitioner` measured the read cost at 3.5% of a 200k window for a full increment brainstorm and 1.2% to start work on a unit, and ruled the cost objection unfounded; **this model's liabilities are entirely on the write side and in the absence of drift detection.**

---

## 2. THE CASE FOR EACH CORE RULE

**0. The three-class lifecycle taxonomy** (L12, L43, implicit throughout) — *the actual contribution; not a listed rule.*
- **Failure mode without it:** every doc carries the same apparent authority, so frozen material (a shipped increment's plan) reads as current, and stale living docs are indistinguishable from fresh ones. This is how a `docs/` folder becomes actively harmful rather than merely neglected.
- **Earns its cost:** two of the three classes are *mechanically* checkable — "is the path under `completed/`?" is a string test (L12); "what does the Status line say?" is a string read (L43). Zero judgment, zero tokens spent on content. Measured: ~24 files excluded from the read set at increment 12.
- **Verdict:** load-bearing — the frame I would keep if everything else were deleted. Both teammates endorsed it as the artifact's real contribution. Its gap (no signal for the living class) is §3/F1 and is closed by E1.

**1. Repo-as-system-of-record** (L7)
- **Failure mode without it:** session N+1 re-derives a settled decision and lands on a *different* answer, producing two contradicting code paths with no artifact recording the conflict. Chat isn't diffable, isn't greppable at the right granularity, is destroyed by compaction, and is invisible to a parallel session.
- **Earns its cost:** near zero — it is the axiom, not a mechanism.
- **Verdict:** load-bearing (axiomatic).

**2. Thin map / table-of-contents-not-encyclopedia** (L8, L18 "~tens of lines")
- **Failure mode without it:** the monolithic CLAUDE.md. Past a few hundred lines, adherence degrades to background texture — the model reads it without acting on it.
- **Earns its cost:** CLAUDE.md is the **only** file charged **per turn** rather than per read. Its cost multiplies by turn count, not task count: `practitioner` measured a realistic map at 884 tokens, so 884 × 60 turns is a different quantity from 2,450 tokens once. That makes brevity a resource constraint for exactly one file — and an aesthetic preference for every other. Both teammates adopted this framing; it is the one cost argument that survived `practitioner`'s ruling against the cost axis generally.
- **Verdict:** load-bearing; highest leverage per word in the doc.

**3. No duplication / one home per fact** (L10)
- **Failure mode without it:** the same fact in ARCHITECTURE.md and in a spec, updated in one place. Two answers now exist and the agent trusts whichever it read first — silent, undetectable staleness. A wrong doc is worse than no doc precisely because it is trusted.
- **Earns its cost:** it makes rule 2 *achievable* rather than aspirational. "Keep CLAUDE.md short" is advice everyone gives, and it fails because facts have nowhere else to go; the routing table (L84) gives every category a named destination, so brevity becomes mechanical. It also functions as the model's own compliance test — it is the rule that condemns the mirrored tests tier (§3/F5) and the skeleton's duplicated routing table (§3/F7).
- **Verdict:** load-bearing.

**4. Facts, not plans** (L11, L38)
- **Failure mode without it:** the most expensive failure in agent-assisted work. ARCHITECTURE.md says "repository layer over Postgres" because that was the plan; the code has SQL in handlers. The agent trusts the doc, writes against a layer that does not exist, and **cannot detect the error** — the doc is authoritative-looking and wrong.
- **Earns its cost:** the #6 refinement ("realized in code", not "merely decided") is hard-won — "decided" would have re-admitted the whole failure. The clause "stays nearly empty; that is correct, not a gap to backfill" does independent work: it pre-empts the model's very strong prior to fill every heading it sees.
- **Verdict:** load-bearing, ranked #1 by cost-of-error. Needs two amendments (E6, E7) and is the rule the artifact currently fails to service (§3/F2).

**5. Source of truth follows the work** (L12)
- **Failure mode without it:** an agent greps `docs/`, hits a `completed/` `plan.md` from four increments ago, and treats a superseded API shape as current.
- **Earns its cost:** almost uniquely here, the check is *mechanical* — path position, not judgment. `practitioner` tested the alternative and found that across two scenarios it never once reached for the roadmap to decide **authority**, only to answer "what's next"; in the skipped-consolidation scenario the roadmap said "done" and was *correct about status while the spec was stale* — accurate and useless in the same breath. Status and authority are different questions, and only the mv answers the second.
- **Verdict:** load-bearing. I defended the `git mv` against the proposal to replace it with a roadmap status line and won on `practitioner`'s deciding vote (§5).

**6. Facts live apart from their why / `docs/decisions/`** (L13, L43, L54)
- **Failure mode without it:** two opposite failures. (a) Rationale silts into the living docs — ARCHITECTURE.md grows "we chose X because Y, rejected Z" per convention and violates rule 3 within a quarter. (b) Rationale is dropped and the choice is re-litigated. With agents, (b) is categorically worse than for humans: **a human team remembers "we settled that"; an agent never does.** This is the only tier that exists specifically to stop an agent re-opening a closed question.
- **Earns its cost:** measured — `practitioner`'s "why integer cents" scenario recovered the reason `NUMERIC` + decimal.js lost (Drizzle returns NUMERIC as a JS string; decimal objects don't survive the Server Action boundary) in 3 files / 1,945 tokens, and rated that information **unobtainable from code at any price**. L54's "the decision never serves as a source for current state" is a real improvement on standard ADR practice, which routinely degrades into a current-state store you must read in full and mentally apply supersessions to.
- **Verdict:** load-bearing, and the most agent-native rule in the model. `skeptic` conceded the tier outright.

**7. Spec vs guideline** (L50)
- **Failure mode without it:** ten specs re-explain the same framework lifecycle and the ten copies drift.
- **Earns its cost:** the load-bearing part is the **negative** clause — "unit-fact vs framework-mechanic, **not** unique-vs-shared". Without it the natural misreading is "shared → guidelines", which strip-mines specs of shared behavior and leaves them non-self-sufficient. Pre-empting the exact wrong generalization is the signature of a rule that has been *used*, not merely written.
- **Correction to my own defense, conceded to `practitioner`:** I defended this rule on cost-of-error and applied the frame to only one arm of an asymmetric pair. Mechanic → spec is cheap and self-correcting (a duplicated paragraph the next consolidation lifts out; measured consequence: one extra debug cycle). Unit-fact → guideline is **contagious, invisible, and unrecoverable**: "transactions reject zero amounts" written into `guidelines/domain-patterns.md` gets applied to a `budget` unit where zero is a legitimate limit, and the guideline is doing exactly what guidelines are for. L50 spends its closing words on the harmless direction and says nothing about the dangerous one.
- **Verdict:** earns its keep, but needs a **directional default**, not just a criterion (E14). This is the one place a teammate changed what I think the doc should *say* rather than what it should add.

**8. Spec vs test doc vs testing guideline** (L45, L52)
- **Failure mode without it:** thin. Two things have no other home: **behaviors verified live but not automated** (by definition absent from the test suite) and the **gap list**. Everything else — which behaviors have tests — is recoverable from the test files, which cannot drift from the code because they *are* code.
- **Why the mirrored tier does not earn it:** `practitioner` wrote both files for one unit and measured the overlap — the spec listed 7 behaviors + 3 invariants; the test doc listed 12 rows *restating the same facts in different words*, because coverage cannot hang off a behavior without repeating the behavior. **The mirrored tree structurally forces a violation of L10** — the tier is not merely redundant, it is non-compliant with the model containing it. L52's justification ("keeps specs lean, lets the two evolve independently") is asserted rather than argued, and it doubles per-unit file count while creating a symmetry obligation.
- **Verdict:** **ornament with a load-bearing core** — my own named ornament. Cut the mirrored tree; keep the residue as a `## Verification` section in the unit's spec (E5).

**9. Two files per increment** (L46, L101)
- **Failure mode without it:** one monolithic increment doc, so every execution session drags the whole brainstorm — rationale, rejected alternatives, discussion — into context just to reach the task list.
- **Earns its cost:** it is a **token** decision, not a taxonomy decision. "Brainstorm output vs task list" requires zero classification judgment, so the rule has essentially no compliance cost. Best benefit/cost ratio in the model.
- **Verdict:** load-bearing, and the cheapest rule here.

### Where this is genuinely ahead of common practice

| Common practice | How it fails | What this model does differently |
|---|---|---|
| Monolithic CLAUDE.md | Grows until ignored; "keep it short" fails because facts have nowhere to go | Every fact category gets a named destination (L84), so brevity is mechanical rather than aspirational |
| `docs/` folder nobody updates | Updating is unowned and untriggered | Maintenance attaches to a work-cycle **event** (step 4) and survives down to a bugfix (L105) — bound to the cycle, not to discipline |
| ADR practice | ADRs get used as current-state docs; you must read all N and apply supersessions mentally | L54 forbids it explicitly and pairs every decision with a living fact that carries the current state |
| SDD tooling (OpenSpec, spec-kit) | Per-change tax, coupling to the tool's lifecycle | Declines the tooling, keeps the structure (L3). Structure is stable; the per-task engine isn't — right layer to standardize |
| "Memory bank" patterns | Read in **full** every session, so cost scales with total project knowledge rather than with the task; state/intent/progress blended in one file | L48's "do NOT keep a single current-state snapshot" is a deliberate rejection, and correct — a snapshot duplicates the specs by construction, violating L10 the moment it is written |
| Diátaxis | Splits by reader *genre* (tutorial/how-to/reference/explanation) | Splits by **lifecycle and authority**, which is what a resuming agent needs: "can I trust this?", not "what genre is this?" |

### Load-bearing → ornament, sorted

- **Protect at all costs:** facts-not-plans (4), no-duplication (3), thin map (2), SoT-follows-the-work (5), two-files-per-increment (9).
- **Earns its keep:** `decisions/` (6), spec-vs-guideline (7) — the latter only once its asymmetry is stated.
- **Trade away first, in order:** (a) the mirrored `docs/tests/<axis>/` coverage matrix; (b) the `<axis>` abstraction as a default; (c) the monorepo section's *placement* (correct content, dilutes a dense document — belongs in its own file). I offered (d) the vision/roadmap split as tradeable; `skeptic` declined the cut on my own churn-isolation reasoning, so it stays.

---

## 3. WHERE THE SKEPTIC IS RIGHT

**F1 — the living tier has no trust signal; the taxonomy is 2/3 mechanical and 1/3 faith. CONCEDE — best idea produced by the panel.** It patches the hole in my own Claim 0. I amplified it (a bare date isn't checkable, since comparing it against `git log` requires guessing the unit's source paths — carry both, E1) and `practitioner` supplied the decisive property: the marker works **not because agents are diligent but because it sits inside a file the session is already reading.** Its skipped-consolidation scenario failed for exactly one reason — the session had no cause to *suspect*: the spec was stale, internally consistent, undated and confident.
*Damage: narrow in scope, central in importance.* One two-line header converts a prose norm into a shell command.

**F2 — `ARCHITECTURE.md` is updated by no step in the workflow. FULL CONCEDE; verified independently by grep.** It appears at lines 11, 13, 19, 38, 39, 41, 48, 54, 84, 112, 124, 125, 128 — and at **none** of the four places describing consolidation (L79 skeleton workflow, L80 sub-increment, L98 step 4, L105 work-smaller-than-an-increment). All four enumerate specs → test docs → guidelines → decisions and stop. Meanwhile L38/L39 promise the intended architecture "migrate[s] here as the code lands", and L48 makes the file half of current state.
Two findings escalate this from an omission to **the worst defect in the artifact**:
- `practitioner` (T4): starting work on a unit loads map + ARCHITECTURE.md + spec + conventions + test doc, and skipping ARCHITECTURE.md's three convention lines produces code violating three conventions at once — rework, not a style miss. **ARCHITECTURE.md is functionally a second always-load file, and the model classifies it as a leaf you follow a link to.**
- `skeptic`'s reframed S8 + `practitioner`'s P2: `lib/money.ts` isn't a "long-lived unit type", so it owns no spec; the fact "money rounds half-up at the presentation boundary" is an architectural convention, so ARCHITECTURE.md is its *only* legal home — and L105 doesn't name it. **A compliant agent following L105 literally has nowhere legal to write the fact it just created.** ARCHITECTURE.md is the destination of last resort for every fact no unit owns.
*Damage: detail — but the largest one.* Not a dodge: this is a defect the model's **own vocabulary made findable**, located by asking "which step owns this transition?", a question only askable because the model names transitions. The monolithic-CLAUDE.md baseline has no findable version of this bug; it just rots. The fix is a name added to four lists plus one clause.

**F3 — there is no read path. CONCEDE.** Write discipline is specified to the sentence; read discipline exists as four scattered fragments (L12 negative, L39 vision-at-planning, L42/69 guidelines-lazy, L101 plan-not-design), none of which answers "I'm starting on unit X — what enters context?" `skeptic` correctly caught me claiming an unearned benefit: my memory-bank comparison praised cost-scaling-with-the-task, a *consequence* of a read path the artifact never specifies. `practitioner` then sharpened the finding and I accept its version over mine: progressive disclosure is **earned for question-answering** (3 files / 1,945 tok, answer unobtainable from code) and **unspecified for task-starting**. The reframe matters because it locates the fix — an explicit always-load / on-demand split, in the CLAUDE.md skeleton (E4).
*Damage: an incomplete half, not a wrong half.*

**F4 — the "already built" rule collides with ARCHITECTURE.md's ownership of conventions. CONCEDE, and this one was RULED AGAINST ME on the deciding vote.** My round-2 reframe (L11 already permits "A and B use P; C uses Q" as a true present-tense statement) was judged half right: that sentence is legal as a *description*, but the load-bearing sentence a fresh session needs is **"new work follows Q"**, which is a rule about what to add, not a description of what exists — and L11/L38 gate the file on "already built and realized in code". `practitioner` ruled it "an internal collision in the doc, not a missing example", and made it the common case rather than an edge: 4 of 6 sessions inside one increment ran against a knowingly-stale Layout block.
Two convergent fixes are on the record and differ only in placement. *Mine (adopted by `skeptic`, who then withdrew his own):* name two content classes in ARCHITECTURE.md, leaving L11 untouched — justified by the doc's own worked example, since L54 calls *"all money amounts are integer cents"* a **fact** and assigns it here, yet that is a rule, not a description, and is not falsified by a non-compliant file existing (E7). *`practitioner`'s:* add one strictly present-tense clause to L11 — "A partially-realized state is itself a fact and is recorded as one: name both shapes, say which parts are in which, and state which one new code must use."
*Damage: detail. Either wording is one clause, and both keep facts-not-plans intact.*

**F5 — the mirrored `docs/tests/<axis>/` tier should be cut. CONCEDE (I named it first; `skeptic` and `practitioner` both converged).** `practitioner`'s measurement is the strongest form of the argument and better than my derivability one: the tier structurally forces an L10 violation, because coverage cannot hang off a behavior without restating it. *Damage: detail; removes an ornament.*

**F6 — `<axis>` is chosen at maximum ignorance with no tie-break and no unit index. CONCEDE.** Bootstrap step 5 (L115) creates `docs/specs/<axis>/` before the system exists; L27 offers `features/` vs `domains/` vs `services/` with no tie-break. `practitioner` confirmed the failure is **duplicate creation** (nothing says "list existing axes before creating a spec") and found a further hole: the axis registry has no home — it is a process fact (L37 → CLAUDE.md), yet the example map ships `<axis>` unfilled in three places. *Damage: detail (E9).*

**F7 — the deployed artifact is a lossy compression with no source. CONCEDE; the most interesting defect in the review.** Found independently by both teammates: the skeleton has no pointer to the operating model, nothing instructs vendoring it, and it encodes the routing table **twice** (map L65–75 *and* hygiene L84). Both are the model's own rules broken by the model's own example — L10 by the duplicate routing table, system-of-record by an artifact with no link to its source. *Damage: detail (E15) — and worth noting the inverse: a framework whose defects are its own rules applied to itself has rules precise enough to function as diagnostics.*

**F8 — the decision bar contains a retrospective disjunct. CONCEDE the wording.** "keeps getting re-litigated" (L43) is evaluable only after the fact, i.e. never when the context still exists (E11). One further clause (E10) also unblocks the forensics path. *Damage: detail.*

**F9 — nothing enforces anything, and consolidation is the single point of failure.** I conceded this unprompted; `skeptic` then correctly refuted my fix as insufficient — consolidation targets written at plan time (a) predict a blast radius a mid-increment discovery won't amend, (b) have no verification step, and (c) **don't exist at all for sub-increment work**, the path carrying most changes over a project's life, since L105 grants "no plan". Marker is the mechanism; targets list is only ergonomics. *Damage: real in the diagnosis (this is the artifact's biggest liability class), detail in the fix.*

**Also conceded, on `practitioner`'s evidence:** the spec-vs-guideline asymmetry (§2 rule 7) — the one concession that changed a rule's *content* rather than adding to it. And my read-side cost arguments, dropped wholesale: 3.5% / 1.2% of window settles it.

### What I did **not** concede

- **The `active/` → `completed/` `git mv` is not tradeable.** Won on the deciding vote; `practitioner`'s clinching argument was one neither `skeptic` nor I found: `skeptic`'s own claim that archiving "turns the miss into active harm" **requires** the mv to carry authority semantics, so it cannot be simultaneously load-bearing enough to cause harm and cheap enough to trade.
- **L45 does not contradict L11** (ruled 2–0 in my favour): a recorded *absence* is a present fact stated negatively; a recorded *intention* is not. The doc still needs the carve-out said out loud (E6).
- **The direction.** Across three rounds, not one concession required removing a principle, reversing a boundary, or changing the taxonomy. Every defect found is one clause wide — which is itself the evidence the structure is sound, and a point `skeptic` conceded for the record.

---

## 4. PROPOSED EDITS

Ordered by value (E0 ranked first on `practitioner`'s assessment). Each marked ADD / CUT / REWORD with its cost.

**E0 — ADD (one line, fixes two independently-found bugs): a status line in the bootstrap `ARCHITECTURE.md`.** At L112:
> Create `ARCHITECTURE.md` containing exactly one line until code lands:
> `Status: nothing built yet — the intended stack and layout live in docs/vision.md`

**Cost:** one line. It is a fact about the file's own state, so it does not violate L11. It repairs (a) the empty-file dead end — `practitioner` found the likeliest day-2 path is empty ARCHITECTURE.md → no route onward → answer from the lockfile — and (b) the read-side orphaning of `vision.md`, which commit 90f5b49 created by moving pre-code stack into vision.md without updating the example map (L67 routes "stack" to ARCHITECTURE.md; L71 never mentions the intended stack). Highest value per character in the review.

**E1 — ADD: a reconcile marker on every living per-unit doc.** In the `docs/specs/` role (L44), **and in the CLAUDE.md skeleton** — `practitioner` found that pointers the doc explicitly prescribes get written and pointers it doesn't prescribe do not:
> Each spec opens with two machine-checkable lines:
> ```
> Source: <glob(s) covering the unit's code>
> Reconciled: <increment slug> (<commit>)
> ```
> `Source` makes the spec's subject locatable; `Reconciled` records when it was last brought level with the code. Together they make staleness **detectable** rather than a matter of trust: if `git log <commit>..HEAD -- <source globs>` returns anything, the code has moved past the spec — trust the code and re-reconcile. This is the living tier's counterpart to the `completed/` path check and the decision's Status line.

**Cost:** two lines per spec during a step already editing the file. `Source:` is arguably a **net reduction** — specs already name their code informally (`practitioner` wrote `domain/transaction/rules.ts` into "Extension points" spontaneously), so one header line replaces scattered ad-hoc mentions. The real cost, which must be owned: it loads the step all three reviewers agree is the weak link. Defensible only because the field is `git rev-parse HEAD` — zero judgment, the easiest possible ask of an exhausted context. **Never grow a third field.** An un-bumped marker still reads truthfully, so it degrades to *honest*, never to *wrong*.

**E2 — ADD: name `ARCHITECTURE.md` in every consolidation enumeration** (step 4 at L98; skeleton workflow at L79; sub-increment at L80 and L105).
> 4. **Consolidate** durable knowledge: architectural facts — stack, layout, commands, conventions, and cross-unit contracts — into `ARCHITECTURE.md`; per-unit state into `docs/specs/*.md`; …

**Cost:** none. A name added to four lists. Closes the worst defect in the artifact, and the sub-increment path (L105) matters most: without it, a fact that belongs to no unit has no legal home.

**E3 — REWORD L39 so the migration is a MOVE with an owner.**
> …and the *intended* architecture (target stack, layout, and the contract between parts) until it is built. As each part lands, that intent is **moved** — not copied — into `ARCHITECTURE.md` at the consolidating increment's step 4; `vision.md` keeps only what is still unbuilt. (Copying would give one fact two homes — see *No duplication*.)

**Cost:** one clause. Settles move-vs-copy, currently derivable from L10 but never stated.

**E4 — ADD: an always-load / on-demand split, in the CLAUDE.md skeleton (L77–88), not the playbook body.**
> ## Reading path
>
> - **Always load:** this map + `ARCHITECTURE.md`.
> - Working on a unit: add that unit's spec. Pull a guideline when its mechanic is in play; a decision when re-opening a settled boundary; `docs/conventions.md` when writing code.
> - Executing an increment: load `plan.md` only — not `design.md`.
> - Do **not** load: `vision.md` / `roadmap.md` except when planning; any `completed/` increment except for history; the `guidelines/` tree wholesale.

**Cost: net negative, once paired with E15.** `practitioner` did the arithmetic: this reading path is ~90 tok/turn, and cutting the skeleton's duplicated routing table (E15, L84) frees ~150 tok/turn — the map at L65–75 already says all of it. Same per-turn budget, slightly smaller. **The model's single largest missing piece is self-funding.** Note this promotes ARCHITECTURE.md to always-load, matching what sessions were measured actually doing, and is why E0/E1/E2 matter more than they look.

**E5 — CUT: the mirrored `docs/tests/<axis>/` tree.** Remove it from the structure block (L29), the role list (L45), hygiene (L84–86), the map (L74), and step 4 (L98). Replace with, in the spec's role:
> A spec carries a `## Verification` section giving each behavior one of three states: `automated`, `live-only`, or `not verified (reason)`. These are the only test facts not recoverable from the test suite, and they belong beside the behaviors they describe.

**Cost:** loses L52's "specs stay lean" property and independent evolution of the two docs. A good trade: the tier structurally forces an L10 violation, and co-location rides the trigger that already exists and is the most-remembered one (L86, "after an increment touches a unit, update its durable spec") instead of needing its own. `## Verification` rather than `## Not covered` because live-only *is* covered, just unautomated. Halves per-unit file count.

**E6 — ADD: the absence-vs-intention carve-out** (required once E5 puts gaps into a source-of-truth doc). Append to L11:
> A recorded *absence* is a fact, not a placeholder: "behavior B has no automated test", "C is verified live only", "D is not implemented" are true statements about the present and are legal in a living doc. A recorded *intention* — "B will be covered", "we will move to Q" — is not.

**Cost:** one sentence; removes an available misreading without weakening L11.

**E7 — ADD: distinguish descriptions from conventions in ARCHITECTURE.md.** At L38 (replaces my earlier weaker "mixed-state" wording, and resolves the L11/L38 collision):
> `ARCHITECTURE.md` holds two kinds of content. **Descriptions** — stack, layout, commands, contracts — record what is realized in code; *Facts, not plans* governs them strictly. **Conventions** are normative rules, and are facts about what is **in force**: a convention is true once adopted, even where existing code predates it. Record the convention, and record the mixed reality beside it — which parts already comply, and the decision that set the direction. What is never recordable is an endpoint written as though it were reached.

**Cost:** one clause. Covers the state a real codebase spends most of its life in (4 of 6 sessions in one increment, measured) and keeps L11 strict for the class where it does its expensive work. Justified by the doc's own example: L54 calls "all money amounts are integer cents" a fact and assigns it here, and that is a rule, not a description.
*Equivalent alternative, from `practitioner` — append to L11 instead, if the author prefers one clause in the principle over a distinction in the file's role:* "A partially-realized state is itself a fact and is recorded as one: name both shapes, say which parts are in which, and state which one new code must use." Strictly present-tense, so facts-not-plans survives either way. Pick one; do not add both.

**E8 — ADD: a home for intra-project cross-unit contracts, and for facts no unit owns.** At L38:
> It also owns **contracts between units** inside the project — a shared event schema, an interface two services agree on — for the same reason the root file owns contracts between subprojects in the monorepo variant: a contract's subject is the *pair*, so neither unit's spec can own it. More generally it is the home for any durable fact **no unit owns** — a cross-cutting convention discovered in a helper that holds no spec of its own. The unit specs link here.

And at L50: "A statement whose subject is a *pair* of units — a contract, a shared schema — belongs to neither spec: it goes in `ARCHITECTURE.md`, and both specs link to it."

**Cost:** one clause each. Closes a class with **zero** legal homes, strictly worse than an ambiguous one.

**E9 — CUT: `<axis>` as the default.** Structure block (L27) becomes `specs/    # one file per long-lived unit, reflecting its CURRENT state`. Close L44 with:
> **Default to a single axis:** `docs/specs/<unit>.md`, so `ls docs/specs/` is the index of units. Split into type subdirectories (`components/`, `services/`, `domains/`) only when a second unit *type* genuinely appears — name the project's axes in CLAUDE.md when you do, and record the split in `docs/decisions/`, since it renames every existing spec path and is exactly the hard-to-reverse case.

**Cost:** a large system loses a little pre-structure, recovered by the scaling sentence. Removes a classification made at maximum ignorance with no tie-break — a duplicate-creation risk — and supplies the missing unit index and axis registry for free.

**E10 — REWORD L12 to scope the `completed/` prohibition.**
> Don't consult a `completed/` design or plan for **current behavior**. It remains the legitimate record of two other things — what that increment did, and why it was decided at the time — which is what makes it usable when a settled question is re-opened later and a decision must be written after the fact.

**Cost:** one clause. Unblocks late-written decisions and post-skipped-consolidation forensics. L101 already calls it a "point-in-time record", so this makes an existing intent explicit rather than adding a rule.

**E11 — REWORD the decision bar (L43) into a prospective form.**
> …is hard to reverse, is counterintuitive, or is a boundary a future session would plausibly re-open.

**Cost:** none.

**E14 — REWORD L50 to state the asymmetry and give a directional default.** Replace the closing sentence ("This is what keeps one mechanic from being re-explained in every unit's spec"):
> Keeping mechanics out of specs prevents one mechanic being re-explained in every unit's spec — but that is the *cheap* error. The dangerous error is the reverse: a unit fact promoted into a guideline gets applied to units it was never true of, silently, because the guideline is doing exactly what guidelines are for. **When unsure, leave it in the spec** — a duplicated mechanic is cheap to lift out later; a false generalization is not.

**Cost:** two sentences. The only edit here that changes a rule's content rather than adding to it, and the one I was wrong about: my cost-of-error defense held in one direction and inverted in the other.

**E15 — CUT the skeleton's duplicated routing table; ADD a pointer to its own source.** In the example CLAUDE.md, the Documentation Map (L65–75) *is* the routing table, so hygiene bullet 1 (L84) collapses to:
> - Keep this file a thin map: every fact category has a home in the map above. Don't duplicate here.

And add one map entry:
> - **docs/operating-model.md** — the documentation and workflow model this repo follows. Read when unsure where a fact belongs.

Plus one line in Bootstrap step 3: "vendor this operating model into the repo as `docs/operating-model.md` and point the map at it."

**Cost:** net negative length — and specifically **~150 tok/turn recovered**, which funds E4's ~90 tok/turn reading path with room to spare. Fixes the model's own example violating the model's own two headline rules: a duplicate fact (L10) and a system of record with no link to its source. Pair with E4 and present them as one change.

**E12 — ADD: a ~12-line summary card at the top of the playbook doc** — the seven principles as one-liners, the routing table, the reading path — so an agent adopting the model can act from the card and consult the 129-line body only for boundary disputes.
**Cost:** ~12 lines of length. Lower priority than E0–E9; the doc currently requires a full read before any action, which is ironic in a document about progressive disclosure.

**Explicitly NOT cut:** the `active/` → `completed/` `git mv` (won on the deciding vote); the vision/roadmap split (I offered it, `skeptic` declined the cut on churn-isolation grounds); `decisions/` (measured as the cleanest win in the review); `guidelines/` (once E14 lands).

---

## 5. OPEN DISAGREEMENTS

Very little survived three rounds. In one line per side:

- **Where the clause for partial reality lands.** The *dispute* was ruled against me: `practitioner` sided with `skeptic` that this is an internal collision needing a clause, not a missing worked example. What remains is placement only — my version names two content classes in ARCHITECTURE.md and leaves L11 untouched (E7, adopted by `skeptic`); `practitioner`'s adds a present-tense clause to L11 itself. Identical output, one clause either way. **Nearest thing to a live disagreement, and it is now a placement question.**
- **Whether the reconcile marker will be *read*, not just written.** *Advocate + practitioner:* it works because it sits inside a file the session is already reading, so it costs no extra step. *Unresolved by anyone:* no one demonstrated a session running the `git log` check unprompted. If agents write it and never check it, E1 is decoration — the highest-value edit on the board is also the least validated.
- **A recording discrepancy, for the lead's attention.** `skeptic`'s round 3 states that `practitioner` "ruled the other way" on gap granularity. It did not — it ruled *"T2 — YOU WIN, skeptic's central gaps.md loses… Still one section, one file"*, i.e. cut the mirrored tree and co-locate in the spec. All three reviewers in fact agree; only `skeptic`'s summary of the ruling is inverted. **Substance is unanimous: E5 as written.**
- **Formally settled, previously contested:** the `git mv` (advocate, on the deciding vote); `L45` vs `L11` (advocate, 2–0); gap granularity — placement to advocate, heading to practitioner's `## Verification`; the per-turn cost argument for the thin map (advocate, upheld after practitioner initially rejected the cost axis wholesale); the spec-vs-guideline asymmetry (practitioner, **against** advocate); partial-reality framing (skeptic + practitioner, **against** advocate); the read-cost objection (practitioner, against skeptic and advocate both).

**Scoreboard, for calibration:** I won the `git mv`, the L45/L11 non-contradiction, gap co-location, and the per-turn cost argument. I lost the partial-reality framing and — more importantly — the spec-vs-guideline asymmetry, which is the only ruling in this review that changed what the document should *say* rather than what it should add. My cost-of-error frame survives as a frame but not as a general license.
