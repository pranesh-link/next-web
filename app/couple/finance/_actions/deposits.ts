/**
 * Barrel module for deposit server actions.
 *
 * Preserves the original public API of `@/couple/finance/_actions/deposits`
 * after the implementation was split across multiple files to satisfy the
 * 300-line-per-file limit.
 */

export { getDeposits, getDepositsSummary } from "./deposits-reads";
export { createDeposit, updateDeposit, deleteDeposit } from "./deposits-mutations";
export { addDepositInstallment, syncDepositReminders } from "./deposits-installments";
export { migrateLegacyDepositAccounts } from "./deposits-migrate";
