/** The transaction list: the page the household actually opens. Server-rendered; the table itself is presentational. */

export const runtime = 'nodejs'

type SearchParams = { period?: string; accountId?: string; categoryId?: string }

/** Reads the period's non-deleted transactions and renders the table with a derived running balance. */
export default async function TransactionsPage({ searchParams }: { searchParams: Promise<SearchParams> }): Promise<React.ReactElement>
