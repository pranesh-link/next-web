/** Finance transaction categories. */
export const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Housing',
  'Utilities',
  'Healthcare',
  'Entertainment',
  'Shopping',
  'Education',
  'Insurance',
  'Investments',
  'EMI',
  'Other',
] as const;

export const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Business',
  'Investments',
  'Rental',
  'Gifts',
  'Refunds',
  'Other',
] as const;

/** Account type display labels. */
export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  SAVINGS_ACCOUNT: 'Savings Account',
  CREDIT_ACCOUNT: 'Credit Account',
  CREDIT_CARD: 'Credit Card',
  RECURRING_DEPOSIT: 'Recurring Deposit',
  FIXED_DEPOSIT: 'Fixed Deposit',
};

/** Asset type display labels. */
export const ASSET_TYPE_LABELS: Record<string, string> = {
  GOLD: 'Gold',
  SILVER: 'Silver',
  STOCK: 'Stock',
  MUTUAL_FUND: 'Mutual Fund',
};

/** Currency configuration. */
export const DEFAULT_CURRENCY = 'INR';
export const DEFAULT_LOCALE = 'en-IN';
