/** Development seed: two accounts, a category set, and three months of plausible transactions. Run with `pnpm db:seed`. */

/** Wipes the seedable tables and reinserts. Refuses to run against a database whose name is not the local one. */
export async function seed(opts?: { months?: number; transactionsPerMonth?: number }): Promise<void>

/** Deterministic pseudo-random amounts, so two seeded databases compare cleanly. */
export function seededAmountCents(index: number): number

await seed()
