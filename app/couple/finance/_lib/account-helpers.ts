/**
 * Shared helpers for rendering financial account types.
 *
 * Single source of truth for the icon and human-readable label associated
 * with each `FinancialAccount.type` enum value.
 */

/**
 * Return an emoji icon for a financial account type.
 *
 * @param type - Account type enum value (e.g. `"SAVINGS_ACCOUNT"`).
 * @returns A short emoji string. Falls back to `"💰"` for unknown types.
 */
export function typeIcon(type: string): string {
  switch (type) {
    case "SAVINGS_ACCOUNT": return "🏦";
    case "CREDIT_ACCOUNT": return "🏧";
    case "CREDIT_CARD": return "💳";
    case "RECURRING_DEPOSIT": return "🔄";
    case "FIXED_DEPOSIT": return "🔒";
    default: return "💰";
  }
}

/**
 * Return a human-readable label for a financial account type.
 *
 * @param type - Account type enum value (e.g. `"SAVINGS_ACCOUNT"`).
 * @returns A friendly label. Falls back to the raw `type` value for unknowns.
 */
export function typeLabel(type: string): string {
  switch (type) {
    case "SAVINGS_ACCOUNT": return "Savings Account";
    case "CREDIT_ACCOUNT": return "Credit Account";
    case "CREDIT_CARD": return "Credit Card";
    case "RECURRING_DEPOSIT": return "Recurring Deposit";
    case "FIXED_DEPOSIT": return "Fixed Deposit";
    default: return type;
  }
}
