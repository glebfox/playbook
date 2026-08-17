/** Drizzle schema. Columns are snake_case in the database and camelCase in code; this file is the only mapping. */

import { pgTable, text, bigint, timestamp, uuid } from 'drizzle-orm/pg-core'

export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  /** Zone the bank's export dates are anchored to at ingest. See decision 0002. */
  zone: text('zone').notNull(),
})

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
})

export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey(),
  accountId: uuid('account_id').notNull().references(() => accounts.id),
  /** Integer cents, signed. See decision 0004. */
  amountCents: bigint('amount_cents', { mode: 'number' }).notNull(),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
  description: text('description').notNull(),
  categoryId: uuid('category_id').references(() => categories.id),
  /** Dedupe handle for imported rows; null for manual entries. See decision 0009. */
  importKey: text('import_key'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  /** Soft delete. See decision 0007. */
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})

export const budgets = pgTable('budgets', {
  id: uuid('id').primaryKey(),
  categoryId: uuid('category_id').notNull().references(() => categories.id),
  periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
  periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
  limitCents: bigint('limit_cents', { mode: 'number' }).notNull(),
  closedAt: timestamp('closed_at', { withTimezone: true }),
})
