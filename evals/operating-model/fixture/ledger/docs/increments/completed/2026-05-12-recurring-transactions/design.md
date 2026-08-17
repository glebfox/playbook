# Increment — recurring transactions

**Landed:** 2026-05-12. Consolidated into `docs/specs/domains/transaction.md` and decision 0002.

## Problem

Rent, two subscriptions and a monthly transfer are typed by hand every period. They are identical every time except for the date, and typing them is both tedious and the most common source of a wrong amount.

## Approach

A **recurrence** is a description, not a transaction: account, category, amount, description, and a schedule (monthly on day N, or weekly on weekday N). Materialization walks the schedule and creates real transactions for periods up to today, marking each with the recurrence it came from.

Materialized transactions are ordinary transactions from that point on. Editing one detaches it from its recurrence rather than rewriting the recurrence — the household's actual behavior is "rent went up in June", not "rent was always this".

Day-of-month schedules clamp: day 31 in a short month materializes on the last day. Discovered while writing the tests, not while designing.

## What was rejected

- **Materializing ahead of time.** A transaction that has not happened yet breaks reconciliation against the bank, which was the whole point of the ledger.
- **Rendering recurrences as virtual rows in the list.** Two kinds of row in one table, and every query would need to know about both.
