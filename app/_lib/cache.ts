import { revalidateTag } from "next/cache";

// ─── Cache Tags ──────────────────────────────────────────────
export const CACHE_TAGS = {
  COUPLE_MEMBERS: "couple-members",
  FINANCE_DASHBOARD: "finance-dashboard",
  FINANCE_BUDGETS: "finance-budgets",
  FINANCE_ACCOUNTS: "finance-accounts",
  FINANCE_TRANSACTIONS: "finance-transactions",
  FINANCE_LOANS: "finance-loans",
  FINANCE_GOALS: "finance-goals",
  FINANCE_DEPOSITS: "finance-deposits",
  FINANCE_INVESTMENTS: "finance-investments",
} as const;

// ─── Revalidation Helpers ────────────────────────────────────
export function invalidateAfterAccountChange() {
  revalidateTag(CACHE_TAGS.FINANCE_ACCOUNTS);
  revalidateTag(CACHE_TAGS.FINANCE_DASHBOARD);
}

export function invalidateAfterTransactionChange() {
  revalidateTag(CACHE_TAGS.FINANCE_TRANSACTIONS);
  revalidateTag(CACHE_TAGS.FINANCE_BUDGETS);
  revalidateTag(CACHE_TAGS.FINANCE_DASHBOARD);
}

export function invalidateAfterBudgetChange() {
  revalidateTag(CACHE_TAGS.FINANCE_BUDGETS);
  revalidateTag(CACHE_TAGS.FINANCE_DASHBOARD);
}

export function invalidateAfterLoanChange() {
  revalidateTag(CACHE_TAGS.FINANCE_LOANS);
  revalidateTag(CACHE_TAGS.FINANCE_DASHBOARD);
}

export function invalidateAfterGoalChange() {
  revalidateTag(CACHE_TAGS.FINANCE_GOALS);
  revalidateTag(CACHE_TAGS.FINANCE_DASHBOARD);
}

export function invalidateAfterDepositChange() {
  revalidateTag(CACHE_TAGS.FINANCE_DEPOSITS);
  revalidateTag(CACHE_TAGS.FINANCE_DASHBOARD);
}

export function invalidateAfterInvestmentChange() {
  revalidateTag(CACHE_TAGS.FINANCE_INVESTMENTS);
  revalidateTag(CACHE_TAGS.FINANCE_DASHBOARD);
}

export function invalidateCoupleMembers() {
  revalidateTag(CACHE_TAGS.COUPLE_MEMBERS);
  revalidateTag(CACHE_TAGS.FINANCE_DASHBOARD);
}
