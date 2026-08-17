---
id: r09-rationale-home
family: routing
finding: control for the decisions tier, and for edit 5a removing the skeleton's routing table
targets: [B]
predicts: control
world: month-3
reps: {haiku: 10, opus: 5}
caps: {budgetUsd: 0.5, timeoutMs: 120000}
grade:
  type: destination
  expect: ["docs/decisions/**"]
  forbid: ["ARCHITECTURE.md", "docs/specs/**", "docs/guidelines/**"]
# Forbidden words in the body: decision, rationale, ADR, log.
---
Writing down why we went with Drizzle instead of Prisma: Prisma's query engine binary would not run on our deploy target, and the reporting queries need raw SQL escape hatches. What we gave up is Prisma Studio and hand-free migrations, and we decided that was worth it.
