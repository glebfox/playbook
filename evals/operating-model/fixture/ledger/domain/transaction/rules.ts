/** Validation guards and the pluggable category rules for the transaction unit. Pure: no I/O, no framework imports (decision 0001). */

import type { TransactionInput, TransactionError, Result } from './index'

/** A zero amount is always a data error, never a legitimate ledger line. */
export function rejectZeroAmount(input: TransactionInput): Result<TransactionInput, TransactionError>

/** An edit inside a closed budget period is rejected with PERIOD_CLOSED. */
export function rejectClosedPeriod(input: TransactionInput, periodClosed: boolean): Result<TransactionInput, TransactionError>

/** Trim and collapse whitespace, so a dedupe key is stable across cosmetic export differences. */
export function normalizeDescription(description: string): string

/** A category rule: first match in declaration order wins. */
export type CategoryRule = { readonly id: string; readonly matches: (input: TransactionInput) => boolean; readonly categoryId: string }

/** Apply rules in declaration order, stopping at the first match. Returns null when nothing matches. */
export function applyCategoryRules(rules: readonly CategoryRule[], input: TransactionInput): string | null
