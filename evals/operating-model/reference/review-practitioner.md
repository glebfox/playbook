# Review — `practitioner` (field-testing referee)

Artifact: `/Users/gorelov/Developer/Other/playbook/harness/operating-model.md`, 129 lines, at `6afc7af`. Line numbers below refer to that file at that commit.

Method: five scenarios run against one concrete project — **Ledger**, a Next.js 15 / React 19 / Postgres 16 / Drizzle / Auth.js personal-finance side project. I materialized the docs the model prescribes, at realistic length, under the scratchpad, and measured them. Every token figure below is computed from actual bytes, not estimated.

Measured per-file sizes (month-3 realistic state):

| File | Lines | Tokens |
|---|---|---|
| `CLAUDE.md` (the doc's own skeleton, filled in) | 31 | 884 |
| `ARCHITECTURE.md` (month 3) | 48 | 514 |
| `ARCHITECTURE.md` (day 1, legal content) | 1 | ~5 |
| `docs/specs/domains/transaction.md` | 42 | 510 |
| `docs/tests/domains/transaction.md` | 18 | 317 |
| `docs/decisions/0004-money-integer-cents.md` | 26 | 547 |
| `docs/vision.md` (est. from structure) | — | ~1125 |
| `docs/guidelines/<one>.md` (est.) | — | ~625 |
| `docs/roadmap.md` / `docs/conventions.md` (est.) | — | ~350 / ~225 |

---

## 1. VERDICT

Yes, this harness is moving in the right direction, and the direction is better than the doc's own presentation of it. Its single biggest strength is the **lifecycle taxonomy**, not the folder list: three classes of document (living / frozen-under-`completed/` / append-only-with-mutable-status) where "can I trust this file?" is answerable from the path or a one-line status without opening it — and the `decisions/` tier in particular buys information that no amount of code-reading reproduces (scenario 4 recovered *why* `NUMERIC` + `decimal.js` was rejected in 3 files / 1,945 tokens; grepping the codebase yields `amountCents` and zero rationale).

Its single biggest liability is that **`ARCHITECTURE.md` is declared "the SINGLE source of truth" (L19) and appears in zero of the four write paths** (L79, L86, L98, L105) — and, when it is legitimately empty on day 1, the map offers no route to where the information actually is (L71 omits stack-intent). Nothing writes to it and nothing finds around it. Compounding that: the model's entire reliability rests on step 4 (consolidate), performed unprompted, at the end of a long context window, by the actor the brief itself describes as having imperfect instruction-following — and there is no drift signal anywhere, so a missed consolidation is undetectable and the doc's own L12 forbids consulting the only surviving accurate record.

The cost objection is a red herring and I will not sign it: 7,096 tokens for a full increment brainstorm is 3.5% of a 200k window. Reads are cheap. The liabilities are all on the write side and in the absence of verification.

---

## 2. SCENARIO LOG

### S1 — Day-1 bootstrap, steps 1–6 run literally

**Ran:** bootstrap steps 1–6 for Ledger, authoring each prescribed file at the content the doc actually permits.

**Result: 5 files, 5 writes, 0 reads.** `CLAUDE.md`, `ARCHITECTURE.md`, `docs/vision.md`, `docs/roadmap.md`, `docs/conventions.md`. Step 5 correctly defers `specs/`, `tests/`, `increments/`, `guidelines/`, `decisions/`; step 6 is a no-op on a green repo.

**Unambiguous:** the sequencing (vision first, then everything derived from it) and the instruction to keep `conventions.md` thin. Deferring five directories to first use is right and saves five empty dirs.

**Where it broke:**

1. **`ARCHITECTURE.md`'s only legal day-1 content is the `#` heading.** `Stack: TBD` violates L11 ("not a gap to backfill with placeholders or TODOs"); `Next.js 15 + Postgres` violates facts-not-plans. Measured: a 1-line file created so a map pointer resolves.
2. **Word collision.** Step 2 (L112) calls the file "a near-empty **placeholder**"; L11 forbids **placeholders**. Same word, opposite senses, 101 lines apart. An agent reconciling the two will guess.
3. **5 of the 9 example-map pointers are dead paths on day 1** (`guidelines/`, `decisions/`, `specs/<axis>/`, `tests/<axis>/`, `increments/`). Step 5 says create lazily; nothing says register-in-map-when-created. Coin flip: ship dead pointers (agent burns turns on failed reads) or omit them (and nobody re-adds them, so a later session never learns the tier exists).
4. **The progressive-disclosure promise fails on day 2 for the most-asked question.** Map L67 routes "stack" → `ARCHITECTURE.md`. Map L71 describes `vision.md` as "what we are building and why; scope and rationale; increment descriptions" — **it never mentions the intended stack.** So the day-2 agent follows the map to a 1-line file and has no onward pointer. Commit `90f5b49` moved stack-intent into `vision.md` and did not update the example map. Traced likeliest behavior: the agent answers from `package.json`/lockfile — accidentally correct and harmless. The agent that *does* reach `vision.md` is the one that reports intent as current fact.
5. **No map pointer to the operating model itself, and nothing says to vendor it.** The deployed artifact is a 31-line lossy compression of a 129-line doc living in another repo. On day 40, ambiguity is unresolvable in-project. Notably, L54's guardrail "the decision never serves as a source for current state" is *lost* in that compression — the skeleton's hygiene bullet (L87) does not carry it.
6. **The example `CLAUDE.md` violates L10 (no duplication) twice over**: the map (L65–75) and hygiene bullet 1 (L84) encode the same routing table. ~150 tokens of the one file whose cost is *per-turn*, not per-read.

**Useful or ceremonial?** Four of five files are useful. `ARCHITECTURE.md` on day 1 is pure ceremony *as specified*, and one added status line converts it to useful.

### S2 — Increment #3: CSV bank-statement import with dedupe

Touches two existing units (`domains/transaction`, `components/transaction-list`), introduces one platform mechanic (Next.js node-vs-edge runtime + streaming upload), one significant decision (`importKey = hash(account, date, amount, description)` vs. bank-provided ID).

**Reads at brainstorm: 13 files + 3 directory listings = 7,096 tokens.** (`CLAUDE.md` 884 + `vision` 1125 + `roadmap` 350 + `ARCHITECTURE` 514 + `conventions` 225 + 2 specs 1020 + 2 test docs 634 + 2 guidelines 1250 + 2 decisions 1094.)
**Reads at execute: 5 files / 2,060 tokens** — the design/plan split genuinely pays here.
**Writes at close: 12 files + 1 `git mv`.** `design.md`, `plan.md`, 2 updated specs + 1 new spec, 3 test docs, 1 new guideline, 1 new decision, `roadmap.md` status, and `ARCHITECTURE.md` (which no step instructs).

**Unambiguous:** the two-file increment split; the date-slug directory naming; the decision bar firing (`importKey` sits in a partial unique index — changing it needs a migration *and* a re-import, so "hard to reverse" fires with zero retrospection needed).

**Five judgment calls two sessions would resolve differently:**

- **(i) Does brainstorm read `docs/guidelines/`?** L42 and L69 both say guidelines are "pulled when implementing, not loaded by default." A *compliant* brainstorm therefore designs the CSV approach blind to the node-vs-edge runtime constraint that invalidates it, and the execute phase has to contradict the approved design. This is the doc's read-discipline actively causing harm, not merely being silent.
- **(ii) Is `csv-import` a new unit, and on which axis** — `features/`, `services/`, or behavior folded into `domains/transaction.md`?
- **(iii) Does the runtime finding go to `guidelines/` or into the `csv-import` spec?**
- **(iv) Who sets `roadmap.md` to in-progress?** Step 5 covers close only.
- **(v) Does "mutations go through Server Actions" reach `ARCHITECTURE.md`?** No step says so.

**Proportionate?** For increment 3 of a system that will see increment 20 — yes. 7k tokens read is 3.5% of window; 12 writes is real but most are 5–40 line edits. For a project that ships four increments and dies, no. The doc has **no adoption threshold** and no "when not to bother" line.

### S3 — One-line bug fix that changes durable behavior

`formatMoney()` rounding changed from half-down to half-up. One line of code.

**Reads: 4 files / 1,790 tokens** (`CLAUDE.md` + owning spec + its test doc + `ARCHITECTURE.md`) plus a `docs/decisions/` listing.
**Writes: 2–3 files.** Doc-file-to-code-line ratio **4:1**.

**"Consolidation without ceremony" does not hold, and the section optimizes the wrong half.** L105 drops `design.md`, `plan.md`, and the roadmap entry — the three *cheapest* artifacts, the ones you were going to think through anyway and which cost ~1,800 tokens of authoring you'd spend on reasoning regardless. It keeps the *expensive* part: routing each new fact across five tiers. So the ceremony that survives is precisely the ceremony that requires judgment.

**And the routing dead-ends.** `lib/money.ts` is not a "long-lived unit *type*," so it owns no spec. The fact "money rounds half-up at the presentation boundary, stored values are never rounded" is a project-wide architectural convention → `ARCHITECTURE.md` → **which L105 never names.** A compliant agent following L105 literally has no legal home for the fact it just created. Verified against my measured `ARCHITECTURE.md`, where exactly this line sits as convention #6 with a `see decision 0009` pointer — it could only have got there by an agent ignoring L105.

### S4 — Month 3, fresh session: "why is money integer cents, and can I change it?"

This is the doc's own worked example (L54), so it is the happy path. It largely delivers.

**The *why*: 3 files, 1,945 tokens.** `CLAUDE.md` (884) → `ARCHITECTURE.md` (514, convention line 1 with `see decision 0004`) → `docs/decisions/0004-money-integer-cents.md` (547). Every hop is unambiguous. What it buys is the point: the rationale — Postgres `NUMERIC` + `decimal.js` rejected because Drizzle returns `NUMERIC` as a JS string and `decimal` objects don't survive the Server Action boundary, so every arithmetic site becomes `a.plus(b)` forever — **is recoverable from nowhere else at any token cost.** This is the strongest single result in the review.

**The *can I change it* half does not deliver.** Fact → decision is topic-addressable; decision → affected-units is not. There is no reverse index. Answering blast radius means grepping ~30 spec + test files (10,125 tokens if read rather than grepped). Grep is cheap so this is not fatal, but the model's "resume without re-reading everything" promise covers *read-one-fact* questions and not *change-impact* questions, and the doc does not distinguish them.

**Minor:** if `0004` were superseded by `0011`, `ARCHITECTURE.md`'s inline `see decision 0004` still points at the old file. One extra hop via the `Status:` line, so recoverable — but L54 says the fact is "updated in place" while saying nothing about repointing the citation. Unspecified hygiene.

### S5 — Failure cases the doc does not cover

**(a) Increment abandoned halfway — the worst, because the doc actively instructs the failure.** Two states exist: `active/` (authoritative, "the work we are currently executing", L12) and `completed/` (shipped history). An increment dropped at 60% stays in `active/` and is therefore **authoritative forever, and lying**. Traced: fresh session runs `ls docs/increments/active/` → `2026-06-02-budget-alerts/` → reads `plan.md` → 6 of 11 tasks checked → resumes task 7, for a cancelled feature, against code where 3 of the 6 landed tasks were reverted. No `abandoned/` state, no rule for the partially-landed code (which the specs now silently misdescribe), no rule saying consolidate-what-landed-then-file-it.

**(b) Two increments in `active/` at once.** L31 says "one directory per increment in progress" — plural is permitted by the wording. Both are authoritative and can contradict each other about the same unit. For a solo dev who parks one thing to fix another, this is the normal state, not an edge case. No collision rule.

**(c) Scope grows mid-flight into two increments.** Task 7 reveals the work is really two. Options with no guidance: keep going (design now stale, increment oversized) or split — but the date-slug is now wrong, half of `plan.md` must move, and nothing says whether the original `design.md` is edited (legal, since it is authoritative while in `active/`) or forked with a back-reference. Two sessions diverge deterministically.

**(d) Mid-increment `ARCHITECTURE.md` — the common case, not the edge.** 60% through a `services/` → `adapters/` split, 3 of 8 modules moved. Under L11 (`already built and realized in code`), the Layout block still says `services/`-only, which is knowably wrong *right now*, and step 4 puts the fix at the end. My increment 3 was 5–6 sessions; **4 of 6 run against a deliberately-stale source of truth.** Worse: the load-bearing sentence a fresh session needs is "new work goes in `adapters/`" — and that is a rule about what to *add*, which L11's built-fact/intent dichotomy has no slot for.

**(e) Spec silently drifted from code — the structural weak link.** Traced skeptic's version: increment 6 shipped without step 4, discovered at increment 9. The session reads `specs/domains/transaction.md` (510 tok): stale, internally consistent, undated, confident. No freshness marker, no last-verified commit, no "code wins" tie-break. Discovery probability without reading the code: zero. Recovery: L12 bolds "Don't consult a `completed/` design or plan for current behavior" with no suspected-stale exception, so the model's rules point *away* from the only accurate record.
**Amplifier I found and both peers adopted:** L45's gap list — otherwise a good feature — *disguises* the miss. My measured test doc carries 3 explicit gap rows, so a behavior absent from the table reads as "not implemented", not "not documented". The feature that was meant to prevent false confidence manufactures it.

**(f) Decision agreed but not yet implemented.** Status vocabulary is `accepted` → `superseded by NNNN`. No `proposed` / `pending`. Decide today to move to multi-currency; code still cents. The decision file says `accepted`; `ARCHITECTURE.md` correctly still says cents. A session that opens `decisions/` first — plausible, it's on the map — gets a numbered, recent, confident, **wrong** statement of current state. L54's guardrail exists but is one of the clauses lost when the doc compresses into the skeleton.

**(g) Shipped increment reverted.** `git revert` of increment 6. Specs now describe behavior that no longer exists; the `completed/` directory is frozen and cannot be un-shipped; the roadmap says done. No rule.

**(h) Renaming a unit.** Spec, test doc, and every inbound link across specs / `ARCHITECTURE.md` / decisions must move together. No rule, and no back-index to find the inbound links.

---

## 3. RULINGS

### The three points all three of us converged on — upheld

- **`ARCHITECTURE.md` is written by no step.** Skeptic (S2) and advocate (concession 1) and I found this independently. **CONFIRMED, highest severity.** Four omissions: L79, L86, L98, L105. My S3 shows it is structural, not probabilistic — for sub-increment work `ARCHITECTURE.md` is the *only* correct home for the fact and is named nowhere. Combined with S1's read-side mirror (L71 has no route to stack-intent), the file is broken on both sides.
- **No read path.** **CONFIRMED**, with my reframing, which skeptic adopted: the damage is **decision amnesia** and **design-time blindness**, not context bloat. The 5-file lean session (2,450 tok) versus my 13-file session (7,096 tok) differ by 4,600 tokens — 2.3% of window, i.e. nothing. What differs that matters is that the lean session never opens `docs/decisions/` and re-litigates a closed question, and that a compliant brainstorm skips `guidelines/` per L42/L69 and designs against a constraint it will only discover at implementation.
- **Consolidation is unverified and archiving turns a miss into active harm.** Skeptic's S1. **CONFIRMED AND UNDERSTATED** by scenario 5(e), for the reason he did not state: there is no legal recovery route, because L12 prohibits the only accurate record.

### Contested — my calls

**T1, the reconcile marker (`Source:` + `Reconciled: <slug> (<sha>)`): IN. Advocate's version, not a trimmed one.**
Decided on 5(e). That scenario failed for exactly one reason: the session had no cause to *suspect*. A `Reconciled:` line does not add a step anyone must remember — it puts the staleness question inside a file the session is already reading, and reduces the check to one command. Even if checked half the time, it converts an undetectable failure into a sometimes-detectable one for a one-line write cost; the payoff is asymmetric.
On maintenance: my own behavior authoring the four docs is evidence. Pointers the doc *prescribes* got written (I put `Harness and patterns: docs/guidelines/testing.md` at the top of the test doc because L52 told me to); pointers it does not prescribe did not appear. So put it in the skeleton, not in prose.
Keep `Source:`, on an argument neither peer made: it is a **net reduction**. My spec already named `domain/transaction/rules.ts` spontaneously under "Extension points" — specs name their code informally anyway. One header line replaces scattered ad-hoc mentions.
**Concession advocate owes:** this loads the step all three of us call the weak link. Defensible only because the field is `git rev-parse HEAD` — zero judgment, the cheapest possible ask of an exhausted context. It must not grow a third field.

**T2, gap-register granularity: ADVOCATE WINS. Co-locate in the spec; skeptic's central `docs/tests/gaps.md` loses; and I am correcting my own earlier position stated to skeptic in round 1.**
What changed my mind was measuring the two files rather than reasoning about them. My `transaction` spec lists 7 behaviors + 3 invariants; the test doc lists 12 rows expressing **the same facts in different words**, because you cannot hang coverage off a behavior without restating the behavior. **The mirrored tree structurally forces a violation of L10, the model's own top rule.** That is a stronger case for cutting the tier than "derivable from a coverage run", and it beats my own round-1 "keep the tier, cut the derivable half."
Co-location beats a central file on **trigger**, which is the only property that determines whether it stays current: L86 already says "after an increment touches a unit, update its durable spec", so gaps ride a trigger that exists and is the most-remembered one. A central `gaps.md` needs its own trigger and is a file nobody opens while working on a unit — on a solo project, never — and re-imports cross-file sync (rename a unit, orphan its gap rows).
**What skeptic keeps:** "verified live, not automated" is not a gap — it *is* covered. So the section needs three states, not two. Name it `## Verification`, rows marked `automated` / `live-only` / `not verified (reason)`.

**T3, the `active/` → `completed/` `git mv`: ADVOCATE WINS decisively, and skeptic's position is internally inconsistent.**
Scenario evidence: across S2 and S4 I never once reached for the roadmap to decide *authority*. I reached for it to answer "what's next". In 5(e) the roadmap said "done" and was **correct about status while the spec was stale** — accurate and useless in the same breath. Status and authority are different questions and the roadmap answers only the first.
Second: the roadmap route requires fuzzy matching. My directory was `2026-05-12-recurring-transactions`; a roadmap line reads "Recurring transactions — done". An agent can get that match wrong. `dirname == "completed"` cannot be got wrong.
Third, and it settles it: skeptic's own S1 claim is that archiving "turns the miss into active harm." That claim *requires* the `mv` to carry authority semantics. He cannot hold that it is load-bearing enough to cause harm and cheap enough to trade away. Also, of the ~4 bookkeeping writes in my 12-write count, the `mv` is the cheapest and the only one producing a machine-checkable invariant.

**T4, the read path: advocate's own falsification threshold is met, and the conclusion drawn from it is wrong.**
"Work on unit `transaction`" loads 5 files / 2,450 tokens — more than map + spec, so by advocate's stated test progressive disclosure is "unearned". I reject the test. Working on `transaction` without `ARCHITECTURE.md`'s conventions produces code violating three at once (integer cents; `domain/` may not import `services/`; errors cross as result unions, never thrown). Those are 3 lines of a 514-token file, and skipping them is rework, not a style miss.
**The correct finding is sharper: `ARCHITECTURE.md` is functionally a second always-load file alongside the map, and the model classifies it as a leaf you follow a link to.** That is why it must never sit empty (S1) or stale (T1), and why its absence from all four write paths is the worst defect. Ruling: progressive disclosure is **earned** for question-answering (S4: 3 files, 1,945 tok, otherwise unobtainable) and **unspecified** for task-starting. Advocate is right that the fix belongs in the skeleton (L77–88), not the body.

**P1 (near-empty `ARCHITECTURE.md` gets read as intent): CONFIRMED WITH A TWIST; advocate's one-line amendment is the top-ranked edit.**
The failure arrives one step earlier than advocate predicted — the map has no route from "stack" to `vision.md` at all, so the likeliest path is answering from the lockfile, which is accidentally correct. The session that *does* reach `vision.md` is the one that reports intent as fact. Either way the same one-line fix repairs advocate's P1 *and* my independently-found S1 dead end. Two bugs, one line.

**P2 (agent skips `ARCHITECTURE.md` at consolidation): CONFIRMED**, and for sub-increment work it is structural rather than probabilistic — see S3.

**P3 (axis divergence): CONFIRMED, with two refinements skeptic accepted.** The failure is **duplicate creation**, not unfindability (`ls docs/specs/*/` is cheap and a later session finds the file). And the deeper hole is that the **axis registry has no home**: it is a process fact (L37 → `CLAUDE.md`), yet the example map ships `<axis>` unfilled in three places. The safe default is already latent in the text ("A focused project may need a single axis") — it just is not stated as a default.

**P4 (spec-vs-guideline mis-calls are recoverable, so judge by cost-of-error): CONFIRMED IN ONE DIRECTION, CONTRADICTED IN THE OTHER. L50's emphasis is backwards.**
Ran it on increment 3's real call. Mis-filing the Next.js node-vs-edge runtime finding into `specs/features/csv-import.md`: increment 7 (PDF upload) doesn't find it, hits the same bug, rediscovers and rewrites it. Cost = one debug cycle + a duplicated paragraph, visible and liftable at the next consolidation. **Recoverable — advocate's frame holds.**
The reverse, which advocate did not test, is not. Put a *unit fact* into a guideline: "transactions reject zero amounts" written into `guidelines/domain-patterns.md`. A session implementing a `budget` domain reads the guideline and applies "reject zero amounts" to budgets, where zero is a legitimate limit. **Wrong behavior in an unrelated unit; contagious; invisible, because the guideline is doing exactly what guidelines are for.**
L50 spends its words on the harmless direction ("what keeps one mechanic from being re-explained in every unit's spec") and says nothing about the dangerous one. Advocate's frame survives but licenses the wrong default until the asymmetry is stated.

**Skeptic's S4 (cut `docs/tests/`): UPHELD ON OUTCOME, REJECTED ON REASONING.** The tier goes, but not because it duplicates a coverage run — because it duplicates the *spec* (7 behaviors restated as 12 rows). And the residue skeptic wanted to discard is the valuable half: "re-categorization idempotence — not tested, behavior added in increment 5, low risk, visible in UI" exists nowhere else and no coverage tool produces it.
**Skeptic's L45-vs-L11 contradiction: CONTRADICTED.** L11 forbids inventing content for facts that do not exist yet; a recorded absence ("not tested, because X") is a true present-tense fact. Skeptic conceded.
**Skeptic's S7 (decision bar needs retrospection): PARTIALLY CONTRADICTED.** The bar is a disjunction and the two prospective clauses fire fine at write time — increment 3's `importKey` is "hard to reverse" (partial unique index; changing it needs a migration *and* a re-import) with zero retrospection. "Keeps getting re-litigated" is a catch-up clause for decisions you skipped, which is correct design. His second half stands: if it *is* re-litigated later, the rationale sits in an archived design L12 tells you not to read.
**Skeptic's S8 (no home for cross-unit contracts): MOSTLY CONTRADICTED, then correctly reframed by him.** Writing the increment-3 spec, the cross-unit invariant landed naturally on the enforcing side — "`importKey` is unique per account when non-null" went into `specs/domains/transaction.md` without hesitation. "The owner is whoever enforces it" is an adequate tie-break and L50's dichotomy held. What survives is his reframe, which my S3 produced: the orphan class is **facts no unit owns**, including non-unit code like `lib/money.ts`, and their route (→ `ARCHITECTURE.md` as a convention) is the route the doc never mentions. Same defect as the top finding, wider surface.
**Skeptic vs advocate on S6 (partial/migration state): SKEPTIC WINS.** Advocate's "the model already has the expressive power, it just lacks a worked example" is half right — "A and B use P, C uses Q" is legal as a description. But the sentence a fresh session actually needs is "**new work follows Q**", and that is a rule about what to add, not a description of what exists. Advocate routes it to `ARCHITECTURE.md` as a convention; L11 gates that file on "already built and realized in code." That is an internal collision in the doc, not a missing example. L11 needs one added clause.
**Cost/fan-out claims (skeptic's S1 fan-out framing and any "this is expensive to read" line): CONTRADICTED, and skeptic conceded.** 7,096 tok = 3.5% of window. My file counts (4–5 for a small change, 12 + 1 `mv` for an increment) match his 2–6 / 10–14 ranges, so the *counts* are confirmed; the *inference* that this makes the model too costly is not.
**One cost claim survives, and it is advocate's: `CLAUDE.md` is charged per *turn*, not per task.** 884 tokens × 60 turns is a different quantity from 2,450 tokens once. So brevity is a genuine resource constraint for exactly one file in the system and an aesthetic preference everywhere else. Upheld — and it is the reason edit 12 (cut the duplicated routing table, ~150 tok/turn) roughly funds edit 4 (add a reading order, ~90 tok/turn) inside the same per-turn budget. The thin-map principle (L8) earns its place on this argument alone; no other tier needs it.

**Who was right, plainly:** skeptic won the two biggest findings (`ARCHITECTURE.md` unwritten; no read path) and the S6 sub-point, and lost on cost, on L45-vs-L11, on cutting the gap register, on the `git mv`, and mostly on S8. Advocate won T2, T3, the lifecycle-taxonomy framing, and P1's fix, conceded the right things early, and was wrong only in over-trusting the cost-of-error frame without checking its reverse direction and in setting a T4 threshold his own model can't meet and doesn't need to.

---

## 4. PROPOSED EDITS

Ranked by scenario pain removed per line added.

**1. ADD — one status line to day-1 `ARCHITECTURE.md`, and stack-intent to the map's `vision.md` pointer.** Fixes S1(4), P1. Two lines total; the highest-value edit on the board.
Step 2 (L112), append: *"Its day-one content is a single status line — `Status: nothing built yet; the intended stack and layout live in docs/vision.md` — which is a fact about the file's own state, not a placeholder, and keeps the map from dead-ending."*
Example map (L71), reword to: *"**docs/vision.md** — what we are building and why; scope and rationale; increment descriptions; **and the intended stack and layout until they are built and migrate to ARCHITECTURE.md.**"*
Cost: nothing. It strictly adds a true statement.

**2. ADD — `ARCHITECTURE.md` to all four write paths (L79, L86, L98, L105).** Fixes the top finding, P2, S3's homeless fact, and skeptic's reframed S8. ~8 words × 4.
L98, append to step 4: *"…and any new architectural convention, layout change, or command into `ARCHITECTURE.md`, moving it out of `docs/vision.md` if that is where the intent lived — this is the migration step, and it is the only one."*
L105, append: *"…update the affected spec and its verification section — **or `ARCHITECTURE.md`, when the changed behavior is a project-wide convention that no single unit owns** — and record the decision, if one was made."*
Cost: the two lists get slightly longer. Unavoidable; the file is either in the write path or it is not a source of truth.

**3. ADD — provenance lines to the spec skeleton (T1).** Fixes S5(e), the gap-list amplifier, and the no-legal-route-to-the-archived-design trap. Two lines per spec + one `git rev-parse` per consolidation.
Add after L44: *"Each spec opens with two provenance lines: `Source:` the code paths it describes, and `Reconciled: <increment-slug> (<sha>)` — the commit the spec was last checked against. Staleness then has a command: `git log <sha>..HEAD -- <source paths>`. If that is non-empty, the code has moved past the spec: the code wins, and refreshing the spec is part of the current change. Update `Reconciled` at every consolidation, including for work smaller than an increment."*
Cost: one more field the weak step must carry. Acceptable only because it is mechanical (`git rev-parse HEAD`) and requires no judgment. Do not let it grow a third field.

**4. ADD — a reading order to the `CLAUDE.md` skeleton (T4, S2(i)).** Fixes decision amnesia and design-time blindness. Four lines, in the artifact that ships.
Insert after L76: *"## Reading order — **Always in context:** this map, and `ARCHITECTURE.md` — its conventions bind every change. **When starting on a unit:** that unit's spec, plus a scan of `docs/decisions/` filenames for anything binding the area. **When designing:** `docs/vision.md` and the relevant `docs/guidelines/` **before** the design is fixed — not at implementation time, or the design will be built against constraints it never saw. **Never:** anything under `docs/increments/completed/`."*
Cost: ~90 tokens of per-turn budget in the one file that has a per-turn budget. Pays for itself against edit 12.

**5. ADD — an `abandoned/` state and an `active/` collision rule.** Fixes S5(a) and S5(b) — the only failure the doc actively instructs a session into. Two lines.
In the tree (L31): add `abandoned/  # increments dropped before shipping — same finality as completed/`.
After L99: *"An increment that stalls does not stay in `active/`. Consolidate whatever part of it landed, then move its directory to `abandoned/` — from that moment it has the same standing as `completed/`: history, never updated, never consulted for current behavior. More than one directory may sit in `active/` at once, but each `plan.md` names the units it touches, so a session can see a collision before it starts."*
Cost: a third terminal state to explain. Small against a failure the current rules guarantee.

**6. CUT — the mirrored `docs/tests/<axis>/` tree; fold into a `## Verification` section in each spec (T2).** Removes a whole tier and the measured 7-behaviors-restated-as-12-rows duplication, i.e. the model's own L10 violation. Rewrite L29, L45, L52, L85, and the map line.
Replacement for L45's role: *"Each spec carries a `## Verification` section: one row per behavior, marked `automated` (with the test path), `live-only` (checked by hand, not automatable or not yet worth it), or `not verified` with a one-line reason. The `not verified` rows are the point — they are the TODO list, and they sit beside the behaviors they describe so a long spec never implies coverage it doesn't have. The reusable *how* of testing stays in `docs/guidelines/`."*
Cost: gives up L52's stated goal of keeping specs lean and letting the two evolve independently. Measured price: +317 tokens on a 510-token spec. Worth it — the independence was illusory, since the two files had to be kept in sync by hand anyway.

**7. REWORD — L50, to name the asymmetry (P4).** Two sentences. Prevents the one mis-call class that produces wrong code rather than duplication.
Append to L50: *"The two directions are not equally costly. A framework mechanic left inside a spec is duplication: the next unit that needs it rediscovers it, and consolidation lifts it out. A unit fact promoted into a guideline is applied to units it was never true of — 'transactions reject zero amounts' becomes a rule a budget domain obeys, where zero is legitimate. When unsure, leave it in the spec."*
Cost: two sentences. Nothing else.

**8. ADD — default to one axis; name the axes in `CLAUDE.md`; list before creating (P3).** Two lines.
Append to L44: *"Default to a single axis and split only when a second unit TYPE genuinely appears. When you split, name the project's axes and the rule for what goes where in `CLAUDE.md` — it is a process fact. Before creating a spec, list the existing axes; a unit with two partial specs under two axes is the failure this prevents."*
And fill `<axis>` in the example map with a concrete value, marked as the project's choice.
Cost: nothing.

**9. ADD — vendor the operating model and point at it from the map.** Fixes S1(5). Two lines.
Bootstrap step 3, append: *"Copy this document into the project (`docs/operating-model.md`) and add it to the map. The `CLAUDE.md` skeleton is a lossy summary of it; when a session hits an ambiguity the summary doesn't settle, the full model must be in the repo to settle it."*
Cost: one vendored file that drifts from upstream. Acceptable — a project pinning the version it adopted is correct, not a bug.

**10. REWORD — L11, to admit partial and in-migration state as fact (S5(d), skeptic's S6).** One sentence. Turns 4-of-6 sessions from knowingly-stale to correct.
Append to L11: *"A partially-realized state is itself a fact and is recorded as one: name both shapes, say which parts are in which, and state which one new code must use. 'Half the services have moved to `adapters/`; new work goes there' is a description of the present, not a plan."*
Cost: slightly softens facts-not-plans. Contained, because the added clause is still strictly present-tense.

**11. ADD — decision-status hygiene (S5(f)).** Two lines.
Append to L43: *"A decision is recorded when it is being acted on. A choice agreed but not yet implemented is still intent: it lives in `vision.md`/`roadmap.md` until it lands. And a decision is never a source for current state — that is what the living docs are for."*
Also carry that last clause into the skeleton's hygiene section (L87), where it is currently lost in compression.
Cost: nothing.

**12. CUT — the duplicated routing table in the example `CLAUDE.md` (L84).** The map immediately above already says all of it. Saves ~150 tokens of per-turn budget in the only file with one — which roughly funds edit 4.
Cost: none. Keep the bullet's second half (the "don't duplicate here" instruction); delete the re-listing of every destination.

**13. ADD — two one-word gaps.** Step 5 should set roadmap status to in-progress *at step 2*, not only at close. And one line for mid-flight scope growth: *"If an increment turns out to be two, close the current one at the last coherent boundary — consolidate and move it — and open the second as a new increment rather than editing the original design to match."*
Cost: nothing.

---

## 5. GAPS THE DOC DOESN'T COVER AT ALL

1. **Abandoned increments.** No third state; `active/` means both "authoritative" and "currently executing", so a dropped increment is a landmine the rules instruct sessions to trust. The only failure in this review the doc *causes* rather than fails to prevent.
2. **More than one increment in `active/`.** Permitted by L31's wording, undefined in effect, and the normal state for a solo dev.
3. **Scope growing mid-flight into two increments.** No rule; date-slug, plan ownership, and whether the design is edited or forked are all coin flips.
4. **Drift detection of any kind.** No freshness marker, no verification step, no code-wins tie-break. The living tier is trusted absolutely and checked never.
5. **Reverting a shipped increment.** `completed/` is frozen and cannot be un-shipped; specs describe removed behavior; roadmap says done.
6. **Renaming or deleting a unit.** Spec, verification rows, and all inbound links must move together, and there is no back-index to find the inbound links.
7. **Change-impact questions.** No reverse index from a decision or convention to the units that depend on it. "Why is X" is 3 files; "what breaks if I change X" is a full-tree grep.
8. **Facts no unit owns.** `lib/money.ts` is not a "long-lived unit type", so rounding, formatting, and error-shape conventions have no spec — and the route that would hold them (`ARCHITECTURE.md`) is absent from every write path.
9. **Whether the operating model itself is vendored.** The shipped artifact is a lossy summary of a doc in another repo, and one of the clauses lost in the summary (L54's "a decision is never a source for current state") is one a session will need.
10. **When *not* to adopt this.** No threshold. The model is proportionate at increment 3 of 20 and pure overhead for a project that ships four increments and stops; the doc never says so.
11. **`CLAUDE.md` vs `AGENTS.md`.** Written as "CLAUDE.md / AGENTS.md" throughout. If a project has both, which is canonical, and does one link the other? This is the one file whose cost is per-turn, so duplicating it is the most expensive duplication available.
12. **Monorepo: an increment whose center of gravity moves.** L126 assigns the directory by center of gravity but gives no rule for a subproject-local increment that grows cross-subproject mid-flight — the directory is now in the wrong place, and so is any decision filed under it.
13. **The brainstorm/design read set.** L42 and L69 place `guidelines/` at implementation time, which means a compliant design is fixed before the platform constraints that govern it are read. Structural, and edit 4 is the fix.
