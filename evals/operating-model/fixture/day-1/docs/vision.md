# Vision

## Why this exists

Two people in one household, three bank accounts and two cards between them, and no honest answer to "can we afford this in March". The banks' own apps each show a third of the picture and none of them will let the two of us look at the same picture. Two years of spreadsheets ended the way spreadsheets end: the formulas were right, the data was three weeks stale, and nobody trusted the total.

Ledger is the smallest thing that fixes that. It should hold every movement of money the household makes, from any source, in one place, and answer a short list of questions about it reliably. It is a side project maintained by one person in evenings — not a product, and it will never have users beyond the two of us. Every scope decision below follows from that.

## Who it is for

- Me, weekly: import, categorize what the rules missed, look at where the month stands.
- My partner, monthly: open one page, see whether we are over on anything.
- Nobody else, ever. No sign-up flow, no onboarding, no support channel.

That last line is load-bearing. Features that only make sense with strangers using the system — invitations, permissions, audit trails for other people's actions — are out of scope permanently, not "later".

## What it has to do well

- **Take in everything.** Bank exports for the accounts that offer them, hand entry for cash, and the same treatment for both once inside. An imported movement and a typed movement must be the same kind of thing.
- **Never double-count.** Exports overlap by design; re-importing a window that was already imported has to be a no-op. This is the hardest requirement in the list and the one most likely to define the shape of the whole thing.
- **Categorize without ceremony.** Rules should do most of it. What the rules miss gets categorized by hand once, and the correction must survive the next import.
- **Reconcile exactly.** The balance Ledger shows for an account and the balance the bank shows have to agree to the cent. When they disagree, the difference must be explainable in terms of specific rows, not a rounding story.
- **Answer the month's question.** "How much is left in this category, this period" is the one question the household actually asks. Everything else is decoration.

## Out of scope

- **No investment or asset tracking.** Positions, valuations and returns are a different problem with a different data model, and the household's investments already live somewhere that reports them.
- **No forecasting.** No projection of next month from this month. With no data at all yet, any prediction would be a guess with a chart around it.
- **No receipt capture.** A large amount of machinery for something neither of us would keep doing past week two.
- **No splitting between the two of us.** One household, joint money. Who paid is not a question we need answered.
- **No native app.** A phone browser is enough, and a second client would double every UI change.
- **No syncing with anything.** Exports get downloaded by hand: annoying once a week, cheap forever.

## Increments

Descriptions only — what each one is and why. Sequence and status live in the roadmap.

1. **Accounts and manual entry.** The account list, a transaction table, hand entry with validation. Enough to replace the spreadsheet for cash, and enough to find out whether the data model survives contact with real entries.
2. **CSV import.** Per-bank column mapping, deduplication of re-delivered rows, and an import summary showing what was accepted and what was skipped. This is the increment that decides whether the project is worth continuing: if importing is not genuinely idempotent, the household will not trust a single total.
3. **Recurring transactions.** Rent, two subscriptions and a monthly transfer are otherwise typed twelve times a year, which is both tedious and the likeliest source of a wrong amount. Described once, materialized per period.
4. **Envelope budgets.** A limit per category per period and the remaining figure the household reads. This is the increment that makes anyone open the app when nothing needs entering.
5. **Export.** Data that goes in and never comes out is a bad property for a system whose whole claim is that you can trust it. Deferred only because there is nothing to export yet.

Later, unscheduled: a yearly view across periods, category rules suggested from repeated manual corrections, and a second pass on category structure once we know how the flat list fails.

## Open questions

- Whether categories stay a flat list or need parents. Flat until it hurts; the pain is easier to describe than to predict.
- How much of the per-bank import mapping should be configuration rather than code. Two banks is not enough evidence.
- Whether a budget period is always a calendar month. Probably, but the household's rent cycle is not, so this may not survive.
