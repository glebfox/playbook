# Design: eval suite for the operating model

Point-in-time design record. Written 2026-07-25, before any of the reviewed edits landed in `harness/operating-model.md`. Revised after a fresh-eyes review of this document.

## Purpose

Measure whether a change to `harness/operating-model.md` actually changes agent behavior, instead of arguing about it. The immediate use is a comparison of a batch of nine edits against a frozen baseline; the suite is built to outlive that batch and take cases from every later change to the document.

Two things this exists to answer:

1. **Do the edits help?** Per-bundle pass-rate deltas against a frozen baseline.
2. **Was the review right?** A finding that predicted a failure the baseline does not reproduce was theoretical. The suite reports those explicitly.

## Scope of this batch

Approved edits, grouped into the bundles that become experiment arms:

| Bundle | Edits | Substance |
|---|---|---|
| A — write paths | 1, 2, 11, 12 | day-1 status line in `ARCHITECTURE.md` + stack-intent route in the map; `ARCHITECTURE.md` named in all four consolidation paths; decision-status hygiene; assorted zero-cost wording (`placeholder` collision, move-not-copy, roadmap in-progress at step 2) |
| B — read path | 3, 4, 5a | reconcile markers (`Source:` / `Reconciled:`); reading order in the `CLAUDE.md` skeleton, including the decisions index rule (`ls` on slugs, `Governs:` line, inbound-link invariant); the cut of the skeleton's duplicated routing table, which funds the reading order inside the same per-turn budget |
| C — adjudication | 8, 9 | spec-vs-guideline asymmetry with a directional default; partially-realized state admitted as fact |

Edit 5 splits by role. Its first half (5a), cutting the skeleton's duplicated routing table, is an arm variable in bundle B. Its second half (5b), vendoring the operating model into the project as `docs/operating-model.md` and pointing the map at it, is **a fixture constant in every arm, baseline included** — it gates the observability of every body-only edit, so it cannot also be one of the things being varied.

Parked, not measured: mirrored `docs/tests/` removal (6), flat-specs default (7), `abandoned/` state (10). Edits 6 and 7 are guarded against regression by controls r10 and r12. **Edit 10 has no guard** — nothing in this suite exercises the `abandoned/` state, and the suite is silent about it rather than protective.

## Layout

```
evals/
  README.md                    # what suites exist, how to run one
  runner/                      # parameterized by a suite path; nothing suite-specific
    schema.mjs  validate.mjs   # case schema and its standalone validator
    stage.mjs                  # temp-dir staging, arm materialization, self-check
    invoke.mjs                 # command construction, stream parsing, auth sanity guard
    grade.mjs                  # verdicts; --self-check against golden/
    run.mjs  report.mjs        # driver and reporting
  operating-model/
    DESIGN.md                  # this file
    PLAN.md                    # implementation plan derived from it
    README.md                  # living: how to run, how to read results, limits
    reference/                 # vendored panel reports: the edits' exact wording, and every case's provenance
    arms/
      01-write-paths.patch     # document hunks + fixture instantiation
      02-read-path.patch
      03-adjudication.patch
    fixture/
      ledger/                  # docs tree + code skeleton, plain files
      history.sh               # builds the git history, writes real shas into specs
    cases/
      routing/*.md
      behavioral/*.md
    results/
      golden/                  # hand-verified verdicts from the calibration run
      <run-id>/                # raw JSONL + verdicts + tally
```

`evals/` sits at the repository root, not under `harness/`, so suites for documents from other topic directories have a home. The runner is shared because copying it per suite is the duplication this repository argues against. It is parameterized by a suite path and reads a fixed case schema — nothing more. No abstraction for hypothetical suite types. **The case schema is the interface** between suite and runner.

## Arms

Five: `baseline`, `A`, `B`, `C`, `ALL`. `ALL` exists to catch interaction — the reading-order edit promotes `ARCHITECTURE.md` to always-load, which pays off only if the write-path edit also keeps that file current. Separate arms would hide that; `ALL` shows it.

**An arm is a pair: patches to the vendored document, *plus* the fixture files that instantiate the document's prescriptions.** This is the definition the rest of the design depends on, and getting it wrong is the failure mode most likely to produce confident meaningless numbers. The `CLAUDE.md` skeleton is a *section of* the document under test; an edit to it is inert unless the fixture's concrete `CLAUDE.md` carries the corresponding change. Otherwise the only channel is "the agent reads the example skeleton inside the vendored document and adopts it as instructions to itself", which is too weak to measure and would make bundle B read as ineffective when it was merely undelivered.

Arm-owned fixture artifacts, enumerated — the arm materializer writes these, the fixture does not:

| Artifact | Present in | Written by |
|---|---|---|
| The concrete `CLAUDE.md` (instantiating the arm's skeleton exactly) | all arms, differing per arm | `arms/*.patch` |
| `Source:` / `Reconciled:` headers on specs | B, ALL | `history.sh <dir> 1` |
| `Governs:` lines in decision files | B, ALL | `history.sh <dir> 1` |
| Inbound citation of decision 0009 from the transaction spec | B, ALL | `history.sh <dir> 1` |
| Day-1 `ARCHITECTURE.md` status line | A, ALL | `stage()` |

The `see decision 0004` pointer in `ARCHITECTURE.md` is **not** arm-owned — a convention citing its decision is the fixture's realistic month-3 state and the operating model's own worked example. Decision 0009 is the uncited one, and that absence is the amnesia condition edit 4's inbound-link invariant repairs.

Every row above is checked by `selfCheck`, not just the first. An artifact class that is declared here but written by nothing would otherwise be "absent everywhere" and pass vacuously — and would leave the fixture incoherent: arm B's reading order would send a session looking for a `Governs:` line that exists in no file, which plausibly suppresses the effect B exists to measure.

Everything else in the fixture is constant, including the vendored `docs/operating-model.md` body, which every arm carries (patched per arm).

The per-arm `CLAUDE.md` diff lives inside `arms/*.patch` alongside the document hunks, so one reviewable file holds everything an arm changes.

Document hunks are materialized as `git show <baseline-sha>:harness/operating-model.md` with the bundle's patches applied. Two consequences, both deliberate:

- **One source of truth for the document.** Four near-identical 130-line copies would need every future edit applied four times, and the drift would silently invalidate arms.
- **The baseline is pinned to a commit, not to "the current file".** Once the edits land, "current" stops being the baseline. Pinning by sha keeps the baseline reproducible permanently, and lets any later run compare `HEAD` against a named historical baseline. Without this the suite is single-use by construction. It also means **the measurement does not depend on when the edits land** — see *Sequence*.

**`ALL` is composed, not authored.** Bundle A adds lines to the skeleton's workflow and hygiene regions; bundle B inserts the reading order and *deletes* the duplicated routing table in the same neighbourhood. Overlapping hunks either fail to apply or, worse, apply cleanly while semantically dropping an A edit that landed inside the region 5a removes — which would make the interaction reading garbage. So: fix the application order (A, then B, then C), materialize `ALL` once, and hand-check a nine-edit presence checklist against its diff before calibration.

**Materialization self-check.** Before every case the runner grep-asserts that arm-owned artifacts are present where they should be and absent where they should not: no reconcile markers, `Governs:` lines, or inbound links in `baseline`, `A`, or `C`. A marker leaking into the baseline is a failure that reads as a null result, which is the one class of bug this suite cannot detect from its own output.

## Delivery

How each arm's text reaches the model under test, stated because every number depends on it and nothing else in the design implies it.

**Routing cases: one turn, pre-assembled context, no tool use.** The context is assembled by the runner and is identical across arms except for arm-owned content:

1. the fixture's concrete `CLAUDE.md` (arm-owned)
2. `docs/operating-model.md` (arm-patched)
3. the output of `ls -R` over the fixture, so the file tree is visible without exploration
4. both domain specs, `docs/specs/domains/{transaction,budget}.md` (arm-owned headers)
5. the case question and its output contract

**Corrected after the first calibration run: item 2 is gone.** Injecting the vendored document produced a ceiling — 68 routing runs, baseline 100% on every case and both tiers, all six predicted-fail cases flagged theoretical. Handing the model the whole rulebook removes the condition the panel's findings came from: a session that follows the thin map and never opens the full model. With the document dropped, baseline falls to 9/12 on Haiku and 11/12 on Opus, and the failures are the predicted ones with the predicted mechanisms — a product fact promoted into a guideline, the planned stack written into `ARCHITECTURE.md`, an agreed-but-unbuilt choice filed as a decision. The stated cost is accepted: bundle C is all document body, so its routing arm is now byte-identical to baseline and measures rep-to-rep noise rather than an effect. C stays observable in the behavioral layer, where the vendored copy sits in the tree and an agent may read it — the first thing `b01`'s session did.

**Corrected during Task 6:** the `day-1` world injects `ARCHITECTURE.md` as well, after item 1. There, and only there, that file's content is arm-owned — the status line in the *Arms* table above — so leaving it out of the context would mean `stage()` writes it, `selfCheck` verifies it, and the model never sees it. It stays out of `month-3`, where it is constant across arms and injecting it would make the destination more salient for the three cases that expect it, inflating the baseline.

Item 3 is what makes r07 and r12 answerable at all — both require knowing which spec paths already exist. Item 4 is what makes r04's contagion bait live: without `budget.md` in view there is no second unit for a false generalization to reach. Pre-assembly rather than exploration is chosen so that arms differ only in what we inject, not in what the model happened to look at.

**Behavioral cases: multi-turn, full tool access, agent explores the fixture itself.** Realism is the point here — the question is what a session actually reads, and pre-assembling the context would answer it by fiat.

**Turn and time caps are stated per case and cap-hits score `error`, not `fail`.** Treated arms prescribe *more reading before writing*, so under a fixed cap they are systematically likelier to be truncated before the graded action occurs. Scoring a truncated run as `fail` would be censoring correlated with the treatment — a manufactured anti-edit effect, in the layer where N=3 makes one censored rep a 33-point swing. Calibration verifies headroom: if any arm's runs land near the cap, the cap is raised before the real run.

## Fixture

**Ledger** — a Next.js 15 / React 19 / Postgres 16 / Drizzle / Auth.js personal-finance side project at a realistic month-3 state. Six files survive from the panel review and are lifted in; the rest is authored to the same realistic length, because measured token counts only mean something if the documents are the size real documents are.

Contents: `CLAUDE.md`, `ARCHITECTURE.md`, `docs/vision.md`, `docs/roadmap.md`, `docs/conventions.md`, `docs/guidelines/{testing,nextjs-runtime}.md`, `docs/decisions/{0004-money-integer-cents,0009-import-key}.md`, `docs/specs/domains/{transaction,budget}.md`, `docs/tests/domains/transaction.md`, one increment under `docs/increments/completed/`. Code skeleton: `app/`, `domain/transaction/`, `lib/money.ts`, `db/schema.ts` — signatures, no implementations. `budget.md` exists specifically so the guideline-contagion case has a second unit where zero is a legitimate limit; `nextjs-runtime.md` exists specifically for the design-blindness case.

The operating model is vendored as `docs/operating-model.md` in every arm (edit 5b). The self-referential consequence is recorded under *Limits*.

Three fixture decisions:

- **Files plus `history.sh`, not a nested git repository.** The runner copies the files into a temp directory and replays a scripted history. No submodule handling, and the history is part of the test design rather than decoration — specific commits must land on `domain/transaction/**` *after* the sha recorded in that unit's spec, or the drift case has nothing to detect.
- **`Reconciled: <sha>` is written by the script after the commit, not stored in the file.** Storing it would require deterministic shas, hence pinned `GIT_AUTHOR_DATE` and author, which is brittle. Writing the real sha post-commit is correct by construction.
- **Three named worlds, each built by whitelist or by additive overlay — never by mutation.** `month-3` is the state above, with an empty `active/`. `day-1` is not a small edit to it but a near-total teardown, so it is a whitelist: keep `CLAUDE.md`, `docs/vision.md`, `docs/conventions.md`, `docs/roadmap.md` and the vendored model; `ARCHITECTURE.md` holds only what its arm prescribes; nothing else exists. Building it by subtraction would leave month-3 residue and silently invalidate `r05`. **Corrected during Task 1: the whitelist is necessary but not sufficient.** Three of the kept files are month-3 documents, and copying them verbatim invalidates `r05` by a second route — the month-3 vision records four landed increments and six weeks of reconciled balances, contradicting the case's "no code exists yet", and the month-3 `ARCHITECTURE.md` records the whole stack, which is the very fact `r05` routes and the one destination it forbids. So `day-1` is whitelist **plus** a three-file overlay (`fixture/day-1/`) carrying day-1 versions of `vision.md`, `roadmap.md` and a near-empty `ARCHITECTURE.md`. The overlay is additive, like `mid-increment`'s, and `assert-day1.mjs` checks the composed result. `month-3-mid-increment` is `month-3` plus an additive overlay: one increment still in `active/` whose code has landed, used by `b04` alone. It is a separate world rather than part of `month-3` because `b02` is told to write a design into `active/`, and a directory already sitting there would push that session into either creating a second increment or consolidating the first — and "more than one increment in `active/`" is the behavior this batch deliberately parked (edit 10). The fixture must not force a session into an undefined state.

## Case schema

Markdown with YAML frontmatter:

```yaml
id: r01-money-rounding-home
family: routing              # routing | behavioral
finding: F2/S3               # which panel finding this encodes
targets: [A]                 # arms that could plausibly move this case
predicts: fail-on-baseline   # fail-on-baseline | control
world: month-3               # month-3 | day-1
reps: {haiku: 10, opus: 5}   # per model; a model absent here is not run
caps: {budgetUsd: 0.5, timeoutMs: 120000}
grade:
  type: destination          # destination | tool-log
  expect: ["ARCHITECTURE.md"]      # list; any member is a pass
  forbid: ["docs/specs/**", "docs/guidelines/**"]
```

`expect` is a list of globs and any member passes — several cases have more than one correct home (`r08`) or name a directory whose concrete file the model may legitimately give (`r03`, `r09`). `reps` is per model because the tiers get different rep counts.

`targets` is what makes the matrix sparse. A case runs against `baseline`, `ALL`, and every arm named in `targets` — for predicted-fail and control cases alike. A control names an arm when that arm could plausibly *break* it: `r03` is handled correctly by the baseline, but edit 8's directional default ("when unsure, leave it in the spec") could push a genuine framework mechanic into a spec. Likewise `r09`, `r11` and `r12` name `B`, because edit 5a **deletes the skeleton's routing table** — the single most routing-relevant removal in the batch. Without those, a regression from 5a would surface only in `ALL`, unattributable, while bundle B's delta was measured by three behavioral cases at N=3 and read clean.

## Grading

**No LLM judge, at run time or reporting time.** A judge is the largest variance source and the shortest path to an eval that measures itself. Two mechanical types:

**`destination`** — the CLI's `--json-schema` enforces a structured answer, `{"destination": "<path>"}`, so the graded value is a validated field rather than a parsed line. The grader matches `destination` against `expect`, then checks `forbid` **against `destination` only**. A last-non-empty-line fallback exists for runs where the schema was not honored.

Two weaker rules were considered and rejected. Whole-answer `forbid` is biased *against* the treatment: a model that reasons — "several units share this, which tempts a guideline, but the subject is the unit, so: the spec" — names a forbidden path while rejecting it, and arm C's asymmetry text makes exactly that articulation *more* likely, so the treated arm would be penalized for reasoning correctly. Last-line-only parsing avoids that bias but is fragile to formatting. Grading a schema-validated field is immune to both: the model may reason freely and only the field counts.

**`tool-log`** — stream-json events are filtered to `tool_use` and projected **per tool**, because a path can arrive by more than one route: `Read`/`Write`/`Edit` project their `file_path`; `Bash` projects paths matched out of the command string. Without the Bash projection, `cat docs/decisions/0004-*.md` and `git log -- domain/transaction` are invisible and b01/b03 false-fail on out-of-band reads.

The predicate language is two constructions: `saw(pattern)` and `saw(a) before saw(b)`, where **`before` compares first occurrences**. The looser exists-before-exists reading would pass a run that writes, reads the decision, then writes again — which is the behavior b01 exists to fail.

`b03`'s predicate carries **a fixed path list** (`domain/transaction/**`), not one parsed from the spec's `Source:` header. That header exists only in arms B and `ALL`; parsing it per-arm would make the baseline fail vacuously and fake an effect for B.

Verdicts are ternary: `pass | fail | error`. `error` covers CLI crashes, timeouts, and cap-hits; it is excluded from the denominator and reported separately. Counting an infrastructure failure as `fail` would manufacture an effect in favour of whichever arm got luckier.

**Calibration.** The first run is N=1 across all combinations, with every verdict reviewed by hand. Those verdicts freeze into `results/golden/`. `grade.mjs` gains a self-check mode that re-grades the golden logs and must reproduce the frozen verdicts. This is the terminus of the "tests for the tests" regress: a golden set, not another layer of tests.

## Case set

### Routing — 12 cases, "here is fact F, name its single home"

Each fact is chosen so the fixture does **not** already state it — otherwise the case measures compliance with an existing file instead of a routing decision, and `assert-fixture.mjs` carries one absence assertion per row to keep that true as the fixture is edited. The prompts themselves are written out in full in `PLAN.md` Task 4, each with the words it may not contain.

| id | Fact | Expected | Arms | Prediction |
|---|---|---|---|---|
| r01 | Money rounds half-up when formatted; stored values never rounded; `lib/money.ts` owns no spec | `ARCHITECTURE.md` | A | fail on baseline — the flagship, practitioner's S3 |
| r02 | Every write path goes through a Server Action | `ARCHITECTURE.md` | A | fail on baseline |
| r03 | `fetch` is cached by default in a Server Component; per-user data needs `cache: 'no-store'` | `docs/guidelines/**` | C | control — catches edit 8 over-correcting |
| r04 | A transaction may not be dated in the future, enforced at the domain boundary; the check's shape is shared | `transaction` spec; `guidelines/**` forbidden | C | fail on baseline — the asymmetry case |
| r05 | The chosen stack, before any code exists (`world: day-1`) | `docs/vision.md` | A | fail on baseline |
| r06 | Data access moving into `db/repositories/`; 3 of 8 done; new work goes there | `ARCHITECTURE.md` as a convention | C | fail on baseline — L11 forbids the directive |
| r07 | `importKey` unique per account when non-null, enforced by a partial index | the enforcing unit's spec | — | control |
| r08 | Multi-currency agreed this morning, nothing written, no currency column | `vision.md` or `roadmap.md` | A | fail on baseline |
| r09 | Why Drizzle beat Prisma, and what was given up | `docs/decisions/**` | B | control |
| r10 | Re-categorization idempotence checked by hand, never automated, low risk | the unit's test doc | — | control (edit 6 parked) |
| r11 | Commit subjects: imperative, under 60 characters, no trailing period | `docs/conventions.md` | B | control |
| r12 | Imported transactions keep a batch reference; the same rules apply as to hand-entered ones | the existing `transaction` spec, not a new `features/` file | B | control (edit 7 parked) |

Six controls, six predicted-fail. Controls are not symmetry — without them "the edit helped" cannot be distinguished from "the edit broke something that worked".

`r06`'s baseline column reads as *compliance with the old rule*, not as error: the baseline document mandates a different answer, and that is the delta mechanism rather than a defect. The report must label it that way.

### Behavioral — 4 cases, graded from the tool log

| id | Task | Log predicate | Arms |
|---|---|---|---|
| b01 | "Move money storage from integer cents to NUMERIC" | `Read(docs/decisions/0004-*)` before first `Write(**)` | B |
| b02 | "Design the CSV import feature and write the design to `docs/increments/active/<slug>/design.md`" | `Read(docs/guidelines/nextjs-runtime.md)` before `Write(**/design.md)` | B |
| b03 | "Implement X in transaction"; fixture has commits past the spec's `Reconciled` sha | a `git log` — not `git diff` — naming a path under `domain/transaction/**` | B |
| b04 | "The increment in `active/` is finished and its code has landed — do what the process says" (`world: month-3-mid-increment`) | `Write` or `Edit` on `ARCHITECTURE.md` | A |

`b01` encodes a real incident that cost a five-hour limit. `b03` is the one case where a **negative result is the most valuable outcome**: failing on arm B as well as baseline would mean reconcile markers get written and never read, settling the panel's first open disagreement against edit 3 — cheaply, before the mechanism ships.

`b04`'s landed increment must contain at least one fact whose only legal home is `ARCHITECTURE.md`; it adds a new build command (`npm run db:seed`) alongside a transaction behavior. A purely unit-behavioral increment would make arm A's *correct* consolidation — specs only — score fail. It deliberately does not describe the `db/repositories/` move: `r06` routes that exact fact, and an increment design stating it would give `r06` a defensible second answer inside `docs/increments/**`, which `r06` forbids. No two cases may contend for the same fact.

## Run size

Sparse matrix, routing: 10 cases at 3 arms (`r01`–`r06`, `r08`, `r09`, `r11`, `r12`) + 2 cases at 2 arms (`r07`, `r10`) = **34 case-arm combinations**.

- Routing: 34 × (10 Haiku reps + 5 Opus reps) = **510 runs**, one turn each on roughly 7k of context. Near-free on Haiku; 170 Opus runs, order of 1.2M input tokens.
- Behavioral: 4 cases × 3 arms × 3 reps, Opus only = **36 runs**, multi-turn. This is the suite's cost centre.

Both model tiers run the routing layer. A weak model is an amplifier: where Opus compensates for a gap in the document by reasoning around it, Haiku shows the edit's clean effect. Opus alone risks a false negative on every edit whose whole job is to stop a model from having to guess.

## Reporting

**Tables are per model tier, never pooled.** Pooling would weight Haiku 2:1 and would contradict the reason both tiers are run — they answer different questions.

Per tier and family: rows are cases, columns are arms, cells are `k/n` plus a delta against baseline. Then per-bundle mean delta, and two call-outs with mechanical thresholds so the no-judge claim holds at the reporting layer too:

- **Control regression** — a control whose pass *rate* drops against baseline by more than `2 / max(n_baseline, n_arm)`, on either tier. The threshold is expressed as a rate, not a pass count: `error` verdicts leave the denominator, so counts across arms are not comparable — 5 of 5 against a baseline 10 of 10 would look like a regression, and a collapse from 5 of 5 to 3 of 10 would not.
- **Theoretical finding** — a predicted-fail case whose baseline pass rate is at or above 80% on **every tier that runs it**. Not "both tiers": behavioral cases run on Opus alone, and requiring two tiers would make them unflaggable. The finding behind such a case did not reproduce. This is the suite testing the review.

Headline bundle deltas average over **predicted-fail cases only**. Controls are flat by construction, so including them pulls every bundle toward zero — one edit working perfectly alongside one flat control would report half the effect. Controls have their own call-out; they are not part of the effect size.

Every run records the resolved model IDs.

## Limits, stated up front

- Confounded with prompt phrasing and fixture realism. Results describe this fixture and these two model tiers.
- Behavioral N=3 surfaces only large effects.
- **A null result on bundle C is expected and is not evidence against edits 8 and 9.** They address rare failures; at these rep counts such an effect drowns. Constructing a case tuned to make them fire would measure the case, not the document.
- **The vendoring half of edit 5 is untestable here** — it is the precondition for observing anything in the document body. Its value has to be argued, not measured.
- **Edit 10 is neither measured nor guarded.**
- `b03`'s grader is deliberately conservative: its predicate matches the Bash **command string** for a `git log` naming the drift path, so drift noticed any other way scores as a miss. Matching a projected path alone would credit `ls domain/transaction` as a drift check and invert this guarantee; broadening from `log` to any `git` invocation would credit the `git add` and `git commit` an implementing agent runs regardless. It can under-credit arm B; it cannot over-credit it.
- Read-side predicates use the `*` tool rather than `Read`, so a decision read via `cat` in a Bash call still counts; write-side predicates use `Write|Edit`, because an agent modifying an existing file uses `Edit`. Both are grader conservatism corrections, not measurement choices.
- No held-out set. It was considered and cut: all 16 cases burn in this run, and a solo maintainer cannot blind himself to cases he wrote. Overfitting is instead bounded by the fact that this batch's nine edits were written and approved before any case existed.

## Sequence

The sha-pinned baseline makes measurement independent of when the edits land, so **all five arms run together**. Running the baseline first and the arms after landing the edits would put model-snapshot drift straight into the treatment delta and open a window to tune cases between the two runs.

1. Build the fixture and `history.sh`; verify the shaped drift exists (`git log <sha>..HEAD -- domain/transaction/**` returns commits).
2. Write the 16 cases with grading blocks.
3. Write the three arm patches, including their `CLAUDE.md` instantiation; materialize `ALL` and hand-check the nine-edit presence checklist.
4. Build the runner and grader, including the materialization self-check.
5. Calibration run: N=1 over all 46 case-arm combinations (34 routing + 12 behavioral), on each tier that runs them — 80 runs. Every verdict reviewed by hand; confirm cap headroom; freeze `results/golden/`.
6. Full run, all five arms interleaved. Commit the numbers.
7. Apply the nine edits to `harness/operating-model.md`. Orthogonal to the measurement, and gated on it only by choice.

Steps 1–3 are verifiable by inspection; steps 4–6 only by running. The implementation plan splits there.
