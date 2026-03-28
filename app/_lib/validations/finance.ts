import { z } from "zod";

export const accountSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  type: z.enum(["SAVINGS_ACCOUNT", "CREDIT_ACCOUNT", "CREDIT_CARD", "RECURRING_DEPOSIT", "FIXED_DEPOSIT"]),
  balance: z.number(),
});

export const transactionSchema = z.object({
  accountId: z.string().uuid(),
  amount: z.number().positive("Amount must be positive"),
  type: z.enum(["INCOME", "EXPENSE"]),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  date: z.coerce.date(),
});

export const budgetSchema = z.object({
  category: z.string().min(1, "Category is required"),
  limit: z.number().positive("Limit must be positive"),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format"),
});

export const loanSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  loanProvider: z.string().optional(),
  loanAccountNumber: z.string().optional(),
  scheduleGeneratedOn: z.string().optional(),
  principal: z.number().positive("Principal must be positive").max(500_000_000, "Principal too large"),
  interestRate: z.number().min(0, "Rate cannot be negative").max(50, "Interest rate unrealistically high"),
  tenureMonths: z.number().int().positive("Tenure must be at least 1 month").max(600, "Tenure cannot exceed 50 years"),
  emiAmount: z.number().positive("EMI must be positive").max(100_000_000, "EMI too large"),
  startDate: z.coerce.date(),
  remainingBalance: z.number().nonnegative("Remaining balance cannot be negative").max(500_000_000, "Balance too large"),
  prepayments: z.array(z.object({
    date: z.string(),
    amount: z.number(),
    balanceAfter: z.number().optional(),
    source: z.enum(["scanned", "manual"]).optional(),
  })).optional(),
  schedule: z.array(z.object({
    month: z.number(),
    date: z.string(),
    emi: z.number(),
    principal: z.number(),
    interest: z.number(),
    balance: z.number(),
  })).optional(),
});

export const goalSchema = z.object({
  name: z.string().min(1, "Name is required"),
  targetAmount: z.number().positive("Target amount must be positive"),
  currentAmount: z.number().nonnegative().default(0),
  deadline: z.coerce.date().optional(),
});

export const budgetPlanSchema = z.object({
  monthAndYear: z.string().regex(/^\d{4}(-\d{2})?$/, "Must be in YYYY-MM or YYYY format"),
  mode: z.enum(["monthly", "yearly"]),
  income: z.number().positive("Income must be positive"),
  lineItems: z.array(z.object({
    category: z.string().min(1, "Category is required"),
    amount: z.number().positive("Amount must be positive"),
    note: z.string().optional(),
  })).min(1, "At least one expense line item is required"),
});

export const coupleSchema = z.object({
  name: z.string().max(100).optional(),
});

export const inviteSchema = z.object({
  email: z.string().email('Valid email is required'),
});

export type AccountInput = z.infer<typeof accountSchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;
export type BudgetInput = z.infer<typeof budgetSchema>;
export type LoanInput = z.infer<typeof loanSchema>;
export type GoalInput = z.infer<typeof goalSchema>;
export type BudgetPlanInput = z.infer<typeof budgetPlanSchema>;
export type CoupleInput = z.infer<typeof coupleSchema>;
export type InviteInput = z.infer<typeof inviteSchema>;
