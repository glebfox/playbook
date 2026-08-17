# Vision

## Why this exists

Two people in one household, three bank accounts and two cards between them, and no honest answer to "can we afford this in March". The banks' own apps each show a third of the picture and none of them will let the two of us look at the same picture. Two years of spreadsheets ended the way spreadsheets end: the formulas were right, the data was three weeks stale, and nobody trusted the total.

Ledger is the smallest thing that fixes that. It holds every movement of money the household makes, from any source, in one place, and answers a short list of questions about it reliably. It is a side project maintained by one person in evenings — not a product, and it will never have users beyond the two of us. Every scope decision below follows from that.

## Who it is for

- Me, weekly: import, categorize what the rules missed, look at where the month stands.
- My partner, monthly: open one page, see whether we are over on anything.
- Nobody else, ever. No sign-up flow, no onboarding, no support channel.

That last line is load-bearing. Features that only make sense with strangers using the system — invitations, permissions, audit trails for other people's actions — are out of scope permanently, not "later".

## What it has to do well

- **Take in everything.** Bank exports for the accounts that offer them, hand entry for cash, and the same treatment for both once inside. An imported movement and a typed movement are the same kind of thing.
- **Never double-count.** Exports overlap by design; re-importing a window that was already imported must be a no-op. This is the single hardest requirement and the reason imports have their own decision record.
- **Categorize without ceremony.** Rules do most of it. What the rules miss gets categorized by hand once, and the correction should not be undone by the next import.
- **Reconcile exactly.** The balance Ledger shows for an account and the balance the bank shows must agree to the cent. When they disagree, the difference has to be explainable in terms of specific rows, not a rounding story.
- **Answer the month's question.** "How much is left in this category, this period" is the one question the household actually asks. Everything else is decoration.

## What it deliberately does not do

- **No investment or asset tracking.** Positions, valuations and returns are a different problem with a different data model, and the household's investments live somewhere that already reports them.
- **No forecasting.** No projection of next month from this month, no "at this rate you will…". The data is three months deep and any prediction from it would be a guess with a chart around it.
- **No receipt capture.** A large amount of machinery for something neither of us would keep doing past week two.
- **No splitting between the two of us.** One household, joint money. Who paid is not a question we need answered.
- **No native app.** A phone browser is enough, and a second client would double every UI change.
- **No syncing with anything.** Exports are downloaded by hand, which is annoying once a week and cheap forever.

## Where it stands, month three

Four increments have landed, in order:

1. **Accounts and manual entry** — the account list, the transaction table, hand entry with validation. Enough to replace the spreadsheet for cash.
2. **CSV import** — per-bank column mapping, dedupe on a content hash, an import summary showing accepted and skipped counts. The one that made the project worth continuing.
3. **Recurring transactions** — a movement that repeats on a schedule is described once and materialized per period, so rent stops being typed twelve times.
4. **Envelope budgets** — a limit per category per period, and the remaining figure the household reads. Periods close, and a closed period rejects edits to the movements inside it.

Roughly two thousand transactions are loaded, covering both accounts since January. Balances have reconciled to the cent for six consecutive weeks, which is the first time this project felt real.

## Still unbuilt

Ordered by how often their absence is felt, not by how hard they are.

- **A yearly view.** Everything is per-period. "What did we spend on groceries last year" is a database query typed by hand.
- **Rules learned from history.** Category rules are written by hand. Most corrections repeat a pattern the data already contains, and nothing looks at it.
- **Export.** Data goes in and never comes out except by reading the database directly — a bad property for a system whose whole claim is that you can trust it, and the thing most likely to be built next.
- **A second pass on category structure.** Categories are a flat list, and two of them are already being used as if they were parents of others.
- **Anything for a bank that changes its export format.** When one does, the import breaks loudly: intended behavior, unpleasant behavior.

## How the next thing gets chosen

Whatever removes the most repeated manual work per evening of effort. That has picked well three times out of four. The exception was envelope budgets, which removed no manual work at all and was built because without it the household did not look at the data — which turned out to matter more.
