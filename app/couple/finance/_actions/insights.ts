/**
 * Barrel module for finance dashboard / insights server actions.
 *
 * Preserves the original public API of `@/couple/finance/_actions/insights`
 * after the implementation was split across multiple files to satisfy the
 * 300-line per-file limit.
 */

export { getDashboardInsights } from "./insights-dashboard";
export { getFinancialHealthScore } from "./insights-health";
