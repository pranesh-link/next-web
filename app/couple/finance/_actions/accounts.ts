/**
 * Barrel module for account server actions.
 *
 * This file preserves the original public API of `@/couple/finance/_actions/accounts`
 * after the implementation was split across multiple files to satisfy the
 * 300-line-per-file limit. All consumers should keep importing from this path.
 */

export {
  getAccounts,
  getAccount,
  getTotalBalance,
  getAccountsPageData,
  getAccountBalanceHistory,
  getCoupleUsers,
  getOverallBalanceHistory,
} from "./accounts-reads";

export { getAccountActivity } from "./accounts-activity";

export {
  createAccount,
  updateAccount,
  deleteAccount,
  updateAccountBalance,
} from "./accounts-mutations";

export {
  setSalaryAccount,
  togglePinAccount,
  setEmergencyFundAccount,
  unsetEmergencyFundAccount,
} from "./accounts-flags";
