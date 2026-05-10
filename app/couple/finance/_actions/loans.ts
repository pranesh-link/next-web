/**
 * Barrel module for loan server actions.
 *
 * Preserves the original public API of `@/couple/finance/_actions/loans` after
 * the implementation was split across multiple files to satisfy the 300-line
 * per-file limit.
 */

export {
  getLoans,
  getLoan,
  simulateLoanPrepayment,
  getLoanInsightsAction,
  getLoanSchedule,
} from "./loans-reads";

export { createLoan, updateLoan, deleteLoan } from "./loans-mutations";

export { addPrepayment, removePrepayment, updateScheduleAction } from "./loans-prepayment";
