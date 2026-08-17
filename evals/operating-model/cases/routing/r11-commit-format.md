---
id: r11-commit-format
family: routing
finding: control for edit 5a — the most routing-sensitive removal in the batch
targets: [B]
predicts: control
world: month-3
reps: {haiku: 10, opus: 5}
caps: {budgetUsd: 0.5, timeoutMs: 120000}
grade:
  type: destination
  expect: ["docs/conventions.md"]
  forbid: ["ARCHITECTURE.md", "docs/guidelines/**", "CLAUDE.md"]
# Forbidden words in the body: convention, style guide, contribution.
---
Settled on how we write commit subjects: imperative mood, under 60 characters, no trailing period.
