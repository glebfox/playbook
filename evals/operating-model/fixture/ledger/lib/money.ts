/** Money lives as integer cents everywhere (decision 0004); this module is the only place it becomes a string. */

/**
 * Render integer cents for display, e.g. -4207 -> "-42.07".
 * Note: inputs are integers today, so no rounding rule is specified here. A split or
 * percentage caller that produces a fraction will need one settled first.
 */
export function formatMoney(amountCents: number, opts?: { sign?: 'auto' | 'always' }): string

/** Parse a user- or export-supplied decimal string into integer cents. Rejects anything with more than two fractional digits. */
export function parseMoney(input: string): { ok: true; cents: number } | { ok: false; reason: 'EMPTY' | 'NOT_A_NUMBER' | 'TOO_PRECISE' }

/** Sum without leaving integer arithmetic. Present so callers stop writing their own reduce. */
export function sumCents(amounts: readonly number[]): number
