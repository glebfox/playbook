/** Public surface of the transaction unit. Spec: docs/specs/domains/transaction.md. */

export type Result<T, E> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E }

export type TransactionError =
  | { readonly tag: 'ZERO_AMOUNT' }
  | { readonly tag: 'PERIOD_CLOSED' }
  | { readonly tag: 'DESCRIPTION_TOO_LONG'; readonly max: number }

export type TransactionInput = {
  readonly accountId: string
  readonly amountCents: number
  readonly occurredAt: Date
  readonly description: string
  readonly categoryId?: string | null
  readonly importKey?: string | null
}

export type Transaction = TransactionInput & { readonly id: string; readonly createdAt: Date; readonly deletedAt: Date | null }

/** Validate, assign a uuid v7, and return the transaction to persist. Never throws. */
export function createTransaction(input: TransactionInput): Result<Transaction, TransactionError>

/** Apply an edit to an existing transaction, subject to the same guards. */
export function editTransaction(existing: Transaction, patch: Partial<TransactionInput>, periodClosed: boolean): Result<Transaction, TransactionError>

/** Derive a running balance over the non-deleted set, in order. */
export function runningBalance(transactions: readonly Transaction[]): readonly { readonly id: string; readonly balanceCents: number }[]

export { rejectZeroAmount, applyCategoryRules, normalizeDescription } from './rules'
