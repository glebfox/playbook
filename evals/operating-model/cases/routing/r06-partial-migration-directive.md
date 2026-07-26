---
id: r06-partial-migration-directive
family: routing
finding: S5(d)/F5 — a partially-realized state and the directive for new code have no legal home
targets: [C]
predicts: fail-on-baseline
world: month-3
reps: {haiku: 10, opus: 5}
caps: {budgetUsd: 0.5, timeoutMs: 120000}
grade:
  type: destination
  expect: ["ARCHITECTURE.md"]
  forbid: ["docs/increments/**", "docs/vision.md", "docs/roadmap.md"]
# Forbidden words in the body: convention, intended, plan, architecture. The fixture describes no
# db/repositories/ layer, so this is a live change of state rather than a restatement.
#
# The most arguable of the twelve on the baseline document — the reason is recorded here so
# calibration reviewers do not relitigate it per rep. An in-progress migration looks like
# increment work, and an active increment's design is authoritative while it runs, so
# docs/increments/active/.../design.md is a defensible-looking answer. It is still wrong, on
# durability: the directive "anything new goes through a repository" outlives the migration,
# while L12 makes designs mortal — they stop being the source of truth the moment the increment
# closes. Filing a standing directive in a document scheduled to die is exactly the misfiling the
# model exists to prevent. The month-3 world also ships an empty active/, so that answer requires
# inventing a directory the tree shows does not exist.
#
# The forbid list cannot poison this case either way: a docs/increments/** answer fails by
# expect-mismatch whether or not it is listed, so forbid only documents intent. And either
# failure mode on baseline — picking the defensible-but-wrong home, or getting lost in L11 — is
# an instance of the predicted failure S5(d)/F5 describes, so the delta against arm C measures
# edit 9 regardless of which one the model falls into.
---
We are moving data access out of the route handlers into `db/repositories/`. Three of the eight handlers have moved; the other five still call Drizzle directly. From here on, anything new goes through a repository.
