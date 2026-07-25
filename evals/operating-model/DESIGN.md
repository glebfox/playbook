# Design: eval suite for the operating model

Point-in-time design record. Written 2026-07-25, before any of the reviewed edits landed in `harness/operating-model.md`.

## Purpose

Measure whether a change to `harness/operating-model.md` actually changes agent behavior, instead of arguing about it. The immediate use is a baseline-then-patched comparison for a batch of nine edits produced by a three-reviewer panel; the suite is built to outlive that batch and take cases from every later change to the document.

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

Edit 5 splits by role. Its first half — cutting the skeleton's duplicated routing table — is an arm variable in bundle B. Its second half — vendoring the operating model into the project as `docs/operating-model.md` and pointing the map at it — is **a fixture constant in every arm, baseline included**, for the reason given under *Fixture* below: it gates the observability of the other arms, so it cannot also be one of the things being varied.

Parked, not measured: mirrored `docs/tests/` removal (6), flat-specs default (7), `abandoned/` state (10). Controls guard them against regression.

## Layout

```
evals/
  README.md                    # what suites exist, how to run one
  runner/
    run.mjs                    # takes a suite path; artifact-agnostic
    grade.mjs                  # + self-check mode against golden/
  operating-model/
    DESIGN.md                  # this file
    README.md                  # living: how to run, how to read results, limits
    arms/
      01-write-paths.patch
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

`evals/` sits at the repository root, not under `harness/`, so suites for documents from other topic directories have a home. The runner is shared because copying it per suite is the duplication this repository argues against; it is parameterized by a suite path and a fixed case schema, and nothing more. **The case schema is the interface** between suite and runner.

## Arms

Five, not four: `baseline`, `A`, `B`, `C`, `ALL`. `ALL` exists to catch interaction — the reading-order edit promotes `ARCHITECTURE.md` to always-load, which pays off only if the write-path edit also keeps that file current. Separate arms would hide that; `ALL` shows it.

An arm is materialized as `git show <baseline-sha>:harness/operating-model.md` with the bundle's patches applied. Two consequences, both deliberate:

- **One source of truth for the document.** Four near-identical 130-line copies would need every future edit applied four times, and the drift would silently invalidate arms.
- **The baseline is pinned to a commit, not to "the current file".** Once the edits land, "current" stops being the baseline. Pinning by sha keeps the baseline reproducible permanently, and lets any later run compare `HEAD` against a named historical baseline. Without this the suite is single-use by construction.

## Fixture

**Ledger** — a Next.js 15 / React 19 / Postgres 16 / Drizzle / Auth.js personal-finance side project at a realistic month-3 state. Six files survive from the panel review and are lifted in; the rest is authored to the same realistic length, because measured token counts only mean something if the documents are the size real documents are.

Contents: `CLAUDE.md`, `ARCHITECTURE.md`, `docs/vision.md`, `docs/roadmap.md`, `docs/conventions.md`, `docs/guidelines/{testing,nextjs-runtime}.md`, `docs/decisions/{0004-money-integer-cents,0009-import-key}.md`, `docs/specs/domains/{transaction,budget}.md`, `docs/tests/domains/transaction.md`, one increment under `docs/increments/completed/`. Code skeleton: `app/`, `domain/transaction/`, `lib/money.ts`, `db/schema.ts` — signatures, no implementations. `budget.md` exists specifically so the guideline-contagion case has a second unit where zero is a legitimate limit; `nextjs-runtime.md` exists specifically for the design-blindness case.

**The operating model is vendored into the fixture as `docs/operating-model.md`, and the map points at it.** This is load-bearing, not cosmetic. Most of the adjudication wording — the spec-vs-guideline asymmetry, built-vs-intended, the significance bar — lives in the model body, not in the `CLAUDE.md` skeleton. A fixture carrying only the skeleton makes arms A and C **unobservable**: the run would return zeros and we would conclude the edits are worthless.

Vendoring is the second half of approved edit 5, so this is consistent with the batch rather than presupposing an unapproved change. But it must be a **constant across all arms, baseline included**, not a variable in bundle B. If it varied, an arm without vendoring could not exhibit any body-only edit: bundle C is entirely body text (the L50 asymmetry, the L11/L38 partial-state clause), and the body halves of edits 1, 2 and 11 — bootstrap step 2, L98, L105 — are equally invisible. Those three are observable at all only because each also has a component in the skeleton.

The consequence is a self-referential blind spot worth naming: **the suite cannot measure the vendoring half of edit 5, because vendoring is the precondition for measuring anything in the document body.** Its value has to be argued, not tested. What the suite does measure is the model *as read*, so results transfer only to projects that vendor it — which, after edit 5 lands, is the prescribed setup.

Three fixture decisions:

- **Files plus `history.sh`, not a nested git repository.** The runner copies the files into a temp directory and replays a scripted history. No submodule handling, and the history is part of the test design rather than decoration — specific commits must land on `domain/transaction/**` *after* the sha recorded in that unit's spec, or the drift case has nothing to detect.
- **`Reconciled: <sha>` is written by the script after the commit, not stored in the file.** Storing it would require deterministic shas, hence pinned `GIT_AUTHOR_DATE` and author, which is brittle. Writing the real sha post-commit is correct by construction.
- **One base state plus a declarative `setup` per case.** Cases need different worlds — the drift case needs commits past the spec's sha, the bootstrap case needs a day-1 `ARCHITECTURE.md`. Five fixtures would diverge; one base plus per-case mutation does not.

**Known coupling.** Reconcile markers exist only in arms B and `ALL`. The baseline's specs must not carry them, or the baseline measures a half-patched state. So marker injection belongs to arm materialization, not to the fixture. This is the one place the two dimensions are entangled and the plan must separate them explicitly — a marker leaking into the baseline is a failure that reads as a null result.

## Case schema

Markdown with YAML frontmatter:

```yaml
id: r01-money-rounding-home
family: routing              # routing | behavioral
finding: F2/S3               # which panel finding this encodes
targets: [A]                 # arms that could plausibly move this case
predicts: fail-on-baseline   # fail-on-baseline | control
setup: [month-3]             # fixture mutations
models: [opus, haiku]
reps: 10
grade:
  type: destination          # destination | tool-log
  expect: ARCHITECTURE.md
  forbid: ["docs/specs/**", "docs/guidelines/**"]
```

`targets` is what makes the matrix sparse. A case runs against `baseline`, `ALL`, and every arm named in `targets` — for predicted-fail and control cases alike. A control names an arm when that arm could plausibly *break* it: `r03` is handled correctly by the baseline, but edit 8's directional default ("when unsure, leave it in the spec") could push a genuine framework mechanic into a spec, so `r03` runs against `C` as a regression guard. A control with no `targets` runs against two arms only.

## Grading

**No LLM judge in v1.** A judge is the largest variance source and the shortest path to an eval that measures itself. Two mechanical types instead:

**`destination`** — the case prompt ends with a hard output contract: reply with exactly one line, the repository-relative path of the single file this fact belongs in, or `NONE`. The grader takes the last non-empty line and compares. `forbid` is then checked **against the whole answer**, not only that line — otherwise "the transaction spec, and note the validation pattern in guidelines" passes, and that answer is precisely the error the case exists to catch.

**`tool-log`** — the stream-json events are filtered to `tool_use`, projected to `(name, path)`, and a predicate is asserted. The predicate language is two constructions and no more: `saw(pattern)` and `saw(a) before saw(b)`. Order is required — "read the decision *before* the first write" is not expressible without it.

Verdicts are ternary: `pass | fail | error`. `error` covers CLI crashes and timeouts; it is excluded from the denominator and reported separately. Counting an infrastructure failure as `fail` would manufacture an effect in favour of whichever arm got luckier.

**Calibration.** The first run is N=1 across all combinations, with every verdict reviewed by hand. Those verdicts freeze into `results/golden/`. `grade.mjs` gains a self-check mode that re-grades the golden logs and must reproduce the frozen verdicts. This is the terminus of the "tests for the tests" regress: a golden set, not another layer of tests.

## Case set

### Routing — 12 cases, "here is fact F, name its single home"

| id | Fact | Expected | Arm | Prediction |
|---|---|---|---|---|
| r01 | Money rounds half-up at the presentation boundary; `lib/money.ts` owns no spec | `ARCHITECTURE.md` | A | fail on baseline — the flagship, practitioner's S3 |
| r02 | "Mutations go through Server Actions" | `ARCHITECTURE.md` | A | fail on baseline |
| r03 | Next.js node-vs-edge runtime gotcha | `docs/guidelines/` | C | control |
| r04 | "Transactions reject zero amounts" | `transaction` spec; `guidelines/**` forbidden | C | fail on baseline — the asymmetry case |
| r05 | Intended stack, day 1 (`setup: day-1`) | `docs/vision.md` | A | fail on baseline |
| r06 | Half of `services/` moved to `adapters/`; "new work goes in adapters/" | `ARCHITECTURE.md` as a convention | C | fail on baseline — L11 forbids it |
| r07 | `importKey` unique per account when non-null | the enforcing unit's spec | — | control |
| r08 | Multi-currency agreed, code still in cents | `vision.md` / `roadmap.md` | A | fail on baseline |
| r09 | Why integer cents were chosen | `docs/decisions/` | — | control |
| r10 | "Re-categorization idempotence not tested" | the unit's test doc | — | control (edit 6 parked) |
| r11 | Commit message format | `docs/conventions.md` | — | control |
| r12 | A behavior of a unit that already has a spec under a different axis | the existing spec file, not a new one | — | control (edit 7 parked) |

Six controls, six predicted-fail. Controls are not symmetry — without them "the edit helped" cannot be distinguished from "the edit broke something that worked".

### Behavioral — 4 cases, graded from the tool log

| id | Task | Log predicate | Arm |
|---|---|---|---|
| b01 | "Move money storage from integer cents to NUMERIC" | `Read(docs/decisions/0004-*)` before first `Write(**)` | B |
| b02 | "Design the CSV import feature and write the design to `docs/increments/active/<slug>/design.md`" | `Read(docs/guidelines/nextjs-runtime.md)` before `Write(**/design.md)` | B |
| b03 | "Implement X in transaction", fixture has commits past the spec's `Reconciled` sha | `git log` or `git diff` naming a path from the spec's `Source:` line | B |
| b04 | "Here is a completed increment's diff; consolidate it" | `Write` or `Edit` on `ARCHITECTURE.md` | A |

`b01` encodes a real incident that cost a five-hour limit. `b03` is the one case where a **negative result is the most valuable outcome**: failing on arm B as well as baseline would mean reconcile markers get written and never read, settling the panel's first open disagreement against edit 3 — cheaply, before the mechanism ships.

## Run size

Sparse matrix, routing: 6 predicted-fail × 3 arms + 1 targeted control × 3 arms + 5 untargeted controls × 2 arms = **31 case-arm combinations**.

- Routing: 31 × (10 Haiku reps + 5 Opus reps) = **465 runs**, one turn each on roughly 7k of context. Near-free on Haiku; about 155 Opus runs, order of 1.1M input tokens. The asymmetric rep count follows from the model choice — signal is cleaner on the weaker model, so N is larger there.
- Behavioral: 4 cases × 3 arms × 3 reps, Opus only = **36 runs**, multi-turn. This is the suite's cost centre.

Both model tiers run the routing layer. A weak model is an amplifier: where Opus compensates for a gap in the document by reasoning around it, Haiku shows the edit's clean effect. Opus alone risks a false negative on every edit whose whole job is to stop a model from having to guess.

## Reporting

One table per family: rows are cases, columns are arms, cells are `k/n` plus a delta against baseline. Then per-bundle mean delta, and two explicit call-outs:

- **Controls whose rate dropped** — regression introduced by the edits.
- **Predicted-fail cases that passed on baseline** — the finding behind them was theoretical. This is the suite testing the review.

## Limits, stated up front

- Confounded with model version, prompt phrasing, and fixture realism. Results describe this fixture and these two model tiers.
- Behavioral N=3 surfaces only large effects.
- **A null result on bundle C is expected and is not evidence against edits 8 and 9.** They address rare failures; at these rep counts such an effect drowns. Constructing a case tuned to make them fire would measure the case, not the document.
- `b03`'s grader is deliberately conservative: drift noticed by means other than a `git` invocation is scored as a miss. It can under-credit arm B; it cannot over-credit it.
- **The vendoring half of edit 5 is untestable here** — it is the suite's own precondition. See *Fixture*.
- Overfitting: a held-out third of cases is designated now, but the discipline starts with the *next* batch. This batch's nine edits are already written and approved, so there is nothing to tune against them.

## Sequence

1. Build the fixture and `history.sh`; verify the shaped drift exists (`git log <sha>..HEAD -- <paths>` returns commits).
2. Write the 16 cases with grading blocks.
3. Build the runner and grader.
4. Calibration run, N=1, all combinations, every verdict reviewed by hand; freeze `results/golden/`.
5. Baseline run. **Commit the numbers.**
6. Apply the nine edits to `harness/operating-model.md`.
7. Full run across all arms. Diff the rates.
