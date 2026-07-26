#!/bin/sh
# Build the fixture's git history. Usage: sh history.sh <dir> <inject-markers:0|1>
set -eu
DIR=$1
MARKERS=${2:-0}
cd "$DIR"

git init -q
git config user.email eval@example.invalid
git config user.name "Eval Fixture"
git config commit.gpgsign false

c() { git add -A && git commit -q -m "$1"; }

# Every commit must change something: `git commit` exits non-zero on an empty tree
# and `set -eu` would abort the script. Do not add a commit without a change.

# 1-4: the project as it stood when the transaction spec was last reconciled
git add -A && git commit -q -m "chore: scaffold Next.js app"
printf '\n// money helpers\n' >> lib/money.ts
c "feat: add db schema and money helpers"
printf '\n// domain glue\n' >> domain/transaction/index.ts
c "feat: add transaction domain"
printf '\n<!-- consolidated at increment 2 -->\n' >> docs/specs/domains/transaction.md
c "docs: consolidate increment 2 — transaction spec"

RECONCILED=$(git rev-parse HEAD)

# 5-8: work that lands AFTER the spec was reconciled. This is the drift.
printf '\nexport const RECURRING_MAX = 60\n' >> domain/transaction/rules.ts
c "feat: recurring transactions — rules"
printf '\n// recurring series are expanded at read time\n' >> domain/transaction/index.ts
c "feat: recurring transactions — expansion"
printf '\n// TODO: rounding is unspecified\n' >> lib/money.ts
c "chore: note rounding gap in money helpers"
printf '\n<!-- increment 3 closed -->\n' >> docs/roadmap.md
c "docs: close increment 3"

# Arm-owned artifacts for bundle B: reconcile markers, Governs: lines, and the inbound
# citation of decision 0009. All four are written here because three of them need $RECONCILED
# or must land after the drift commits; a fixture carrying only some of them is incoherent —
# arm B's reading order would send the model looking for a Governs: line that does not exist.
if [ "$MARKERS" = "1" ]; then
  SPEC=docs/specs/domains/transaction.md
  TMP=$(mktemp)
  {
    head -1 "$SPEC"
    echo ""
    echo "Source: domain/transaction/**, lib/money.ts"
    echo "Reconciled: 2026-05-12-recurring-transactions ($RECONCILED)"
    tail -n +2 "$SPEC"
  } > "$TMP"
  mv "$TMP" "$SPEC"

  # Cites without stating. The obvious wording — "the importKey uniqueness invariant is settled,
  # see decision 0009" — would inject r07's routed fact straight into r07's own context in arms
  # B and ALL, changing its answer landscape for a reason unrelated to any routing rule.
  printf '\nImport identity: see decision 0009.\n' >> "$SPEC"

  for D in docs/decisions/0004-money-integer-cents.md docs/decisions/0009-import-key.md; do
    TMP=$(mktemp)
    case "$D" in
      *0004*) G="Governs: money storage and arithmetic; ARCHITECTURE.md conventions; lib/money.ts" ;;
      *0009*) G="Governs: transaction import identity; docs/specs/domains/transaction.md" ;;
    esac
    { head -1 "$D"; echo ""; echo "$G"; tail -n +2 "$D"; } > "$TMP"
    mv "$TMP" "$D"
  done

  git add -A && git commit -q -m "docs: add reconcile markers, Governs lines, and decision citations"
fi

git log --oneline | head -20
