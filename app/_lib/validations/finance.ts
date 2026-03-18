import { z } from "zod";

export const accountSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  type: z.enum(["BANK", "CASH", "CREDIT_CARD"]),
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
  name: z.string().min(1, "Name is required"),
  principal: z.number().positive("Principal must be positive"),
  interestRate: z.number().min(0).max(100),
  tenureMonths: z.number().int().positive("Tenure must be a positive integer"),
  emiAmount: z.number().positive("EMI must be positive"),
  startDate: z.coerce.date(),
  remainingBalance: z.number().nonnegative("Remaining balance cannot be negative"),
});

export const goalSchema = z.object({
  name: z.string().min(1, "Name is required"),
  targetAmount: z.number().positive("Target amount must be positive"),
  currentAmount: z.number().nonnegative().default(0),
  deadline: z.coerce.date().optional(),
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
export type CoupleInput = z.infer<typeof coupleSchema>;
export type InviteInput = z.infer<typeof inviteSchema>;
