# Operating-model eval suite

Measures whether a change to `harness/operating-model.md` changes what an agent actually does: where it files a fact, and what it reads before it writes. Five document arms — `baseline`, `A`, `B`, `C`, `ALL` — against a frozen synthetic project, graded mechanically, with no LLM judge anywhere.

Design of record: [DESIGN.md](DESIGN.md). How it was built, task by task: [PLAN.md](PLAN.md).

## Status

**Not yet measured.** Everything below runs; nothing has been run against a model. Two things must happen first, both from a normal terminal — nested `claude` invocations from inside a Claude Code session fail auth, so they cannot be done from an agent session:

1. `sh evals/runner/verify-cli.sh` — auth, plus the six CLI behaviors the runner assumes but the smoke tests never covered. Anything that fails there is a fix before the calibration run, not after.
2. The calibration run, then the golden freeze (PLAN.md Task 8, steps 3–5). Until `results/golden/` holds frozen verdicts, `grade.mjs --self-check` reports `0 frozen verdicts` and the grader is unprotected against its own future edits.

The isolation mode the golden set was produced in gets recorded here once it exists. It matters: without `ANTHROPIC_API_KEY`, `--setting-sources project` breaks auth, so the suite falls back to loading host settings and host hooks fire inside every run. That contamination is arm-invariant, so it does not bias the deltas — but the skills-gate hook pushes a session to go looking for skills, which can partially substitute for the reading-order edit and **mask bundle B**.

## Running it

```bash
node evals/runner/validate.mjs evals/operating-model
```

```bash
node evals/runner/run.mjs --suite evals/operating-model --run-id calibration-1 --reps 1
```

```bash
node evals/runner/run.mjs --suite evals/operating-model --run-id full-1
```

The full run is 546 invocations: 510 routing (one turn each, ~7.5k of context, both tiers) and 36 behavioral (multi-turn, Opus only — the cost centre). Add `--resume` if a run dies partway; it skips what the ledger already has instead of re-spending it.

Checks that need no model, and should all pass before any run:

```bash
node evals/operating-model/fixture/assert-fixture.mjs && node evals/operating-model/fixture/assert-day1.mjs && node evals/operating-model/arms/assert-arms.mjs && node evals/runner/validate.mjs evals/operating-model && node --test evals/runner/*.test.mjs
```

## Reading the results

`results/<id>/runs.jsonl`, one row per invocation: `caseId`, `arm`, `model`, `rep`, `verdict`, `reason`, `resolvedModel`, `costUsd`, `hookEvents`, `isolated`, and the `streamFile` holding the raw events behind the row.

Verdicts are ternary. `pass` and `fail` are answers; **`error` is not** — it covers crashes, timeouts and cap-hits, is excluded from the denominator, and is reported separately. That distinction is load-bearing rather than tidy: treated arms prescribe *more reading before writing*, so under a fixed cap they are systematically likelier to be truncated, and scoring a truncated run as `fail` would be censoring correlated with the treatment.

Tables are **per model tier, never pooled** — Haiku carries twice the reps, and the two tiers answer different questions. A weak model is an amplifier: where Opus reasons around a gap in the document, Haiku shows the edit's clean effect.

Two call-outs have mechanical thresholds, so the no-judge claim holds at the reporting layer too:

- **Control regression** — a control whose pass *rate* drops against baseline by more than `2 / max(n_baseline, n_arm)` on either tier.
- **Theoretical finding** — a predicted-fail case whose baseline pass rate is at or above 80% on every tier that runs it. The finding behind it did not reproduce. This is the suite testing the review.

Headline bundle deltas average over **predicted-fail cases only**. Controls are flat by construction, so including them would pull every bundle toward zero.

`r06` is the one case whose baseline column reads as *compliance with the old rule* rather than as error: the baseline document mandates a different answer. That is the delta mechanism, not a defect, and the report must label it that way.

## Limits, stated up front

Copied from [DESIGN.md](DESIGN.md); the design is the record, this is the copy you are likelier to read.

- Confounded with prompt phrasing and fixture realism. Results describe this fixture and these two model tiers.
- Behavioral N=3 surfaces only large effects.
- **A null result on bundle C is expected and is not evidence against edits 8 and 9.** They address rare failures; at these rep counts such an effect drowns. Constructing a case tuned to make them fire would measure the case, not the document.
- **The vendoring half of edit 5 is untestable here** — it is the precondition for observing anything in the document body. Its value has to be argued, not measured.
- **Edit 10 is neither measured nor guarded.**
- `b03`'s grader is deliberately conservative: its predicate matches the Bash **command string** for a `git log` naming the drift path, so drift noticed any other way scores as a miss. Matching a projected path alone would credit `ls domain/transaction` as a drift check and invert this guarantee; broadening from `log` to any `git` invocation would credit the `git add` and `git commit` an implementing agent runs regardless. It can under-credit arm B; it cannot over-credit it.
- Read-side predicates use the `*` tool rather than `Read`, so a decision read via `cat` in a Bash call still counts; write-side predicates use `Write|Edit`, because an agent modifying an existing file uses `Edit`. Both are grader conservatism corrections, not measurement choices.
- No held-out set. It was considered and cut: all 16 cases burn in this run, and a solo maintainer cannot blind himself to cases he wrote. Overfitting is instead bounded by the fact that this batch's nine edits were written and approved before any case existed.

One more, added during implementation: the `## Reading order` section's decisions-index bullet — `ls` on slugs, the `Governs:` line, the inbound-link invariant — is **wording authored while building the suite**, not wording the review panel approved. `DESIGN.md` assigns those three mechanics to edit 4 and the fixture already carries two of them, but no panel report contains a sentence for them. If bundle B moves, that bullet is part of what moved.
