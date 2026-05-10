/**
 * Barrel module for transaction server actions.
 *
 * Preserves the original public API of `@/couple/finance/_actions/transactions`
 * after the implementation was split across multiple files to satisfy the
 * 300-line per-file limit.
 */

export {
  getTransactions,
  getTransactionsPageData,
  getTransaction,
  getTransactionsByMonth,
  getCategoryAggregation,
} from "./transactions-reads";

export {
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "./transactions-mutations";
