# evals

Suites that measure whether a change to a document in this repository actually changes agent behavior, instead of arguing about it.

A **suite** is a directory holding everything specific to one measurement: the document arms being compared, a synthetic project the model works in, the cases, and the results. The **runner** is shared and knows nothing about any particular suite — it is parameterized by a suite path and reads a fixed case schema. That schema is the whole interface between the two.

```
evals/
  runner/                    # generic; parameterized by --suite
    schema.mjs validate.mjs  # the case schema and a standalone validator
    stage.mjs                # temp-dir staging, arm materialization, self-check
    invoke.mjs               # command construction, stream parsing, auth sanity guard
    grade.mjs                # mechanical verdicts; --self-check against a frozen golden set
    run.mjs                  # the driver
    report.mjs               # per-tier tables, per-bundle deltas, call-outs
  <suite>/
    DESIGN.md                # why the measurement is shaped this way
    PLAN.md                  # how it was built
    README.md                # how to run it, how to read it, what it cannot tell you
    arms/                    # the document variants being compared, as patches
    fixture/                 # the synthetic project the model works in
    cases/                   # one file per case: frontmatter + prompt
    results/                 # golden/ plus one directory per run
```

## Running a suite

```bash
node evals/runner/validate.mjs evals/<suite>
```

```bash
node evals/runner/run.mjs --suite evals/<suite> --run-id <id>
```

Useful flags: `--case <prefix>` to run one case, `--reps <n>` to override every case's rep count, `--resume` to skip combinations already recorded under that run-id, `--allow-contaminated` to run without settings isolation (it warns, loudly, because host hooks then fire inside every run).

Results land in `evals/<suite>/results/<id>/`: `runs.jsonl` with one row per invocation, and `streams/` with the raw event log behind each row.

## Suites

- [operating-model](operating-model/README.md) — does editing `harness/operating-model.md` change where an agent files a fact, and what it reads before writing?

## Adding a suite

Copy the directory shape above. The runner needs three things from you: `arms/` producing a document variant per arm name, a `fixture/` it can stage into a temp directory, and `cases/` conforming to the schema in `runner/schema.mjs`. Anything a suite needs that the runner does not already do belongs in the suite, not in the runner — the runner stays generic or it stops being shareable.
