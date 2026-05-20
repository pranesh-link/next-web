import { z } from 'zod';

export const accountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  nickname: z.string().max(50).optional(),
  type: z.enum(['SAVINGS_ACCOUNT', 'CREDIT_ACCOUNT', 'CREDIT_CARD', 'RECURRING_DEPOSIT', 'FIXED_DEPOSIT']),
  balance: z.number(),
});

export const transactionSchema = z.object({
  accountId: z.string().uuid(),
  amount: z.number().positive('Amount must be positive'),
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  date: z.coerce.date(),
});

export const budgetSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  limit: z.number().positive('Limit must be positive'),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
});

export const loanSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  loanProvider: z.string().optional(),
  loanAccountNumber: z.string().optional(),
  scheduleGeneratedOn: z.string().optional(),
  principal: z.number().positive('Principal must be positive').max(500_000_000, 'Principal too large'),
  interestRate: z.number().min(0, 'Rate cannot be negative').max(50, 'Interest rate unrealistically high'),
  tenureMonths: z.number().int().positive('Tenure must be at least 1 month').max(600, 'Tenure cannot exceed 50 years'),
  emiAmount: z.number().positive('EMI must be positive').max(100_000_000, 'EMI too large'),
  startDate: z.coerce.date(),
  remainingBalance: z.number().nonnegative('Remaining balance cannot be negative').max(500_000_000, 'Balance too large'),
  prepayments: z.array(z.object({
    date: z.string(),
    amount: z.number(),
    balanceAfter: z.number().optional(),
    source: z.enum(['scanned', 'manual']).optional(),
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
  name: z.string().min(1, 'Name is required'),
  targetAmount: z.number().positive('Target amount must be positive'),
  currentAmount: z.number().nonnegative().default(0),
  deadline: z.coerce.date().optional(),
});

const budgetLineItem = z.object({
  category: z.string().min(1, 'Category is required'),
  amount: z.number().positive('Amount must be positive'),
  note: z.string().min(1, 'Note is required'),
  paid: z.boolean().optional().default(false),
});

export const budgetPlanSchema = z.object({
  monthAndYear: z.string().regex(/^\d{4}(-\d{2})?$/, 'Must be in YYYY-MM or YYYY format'),
  mode: z.enum(['monthly', 'yearly']),
  income: z.number().positive('Income must be positive'),
  lineItems: z.array(budgetLineItem).min(1, 'At least one expense item is required'),
}).strict();

export const investmentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(120, 'Name too long'),
  assetType: z.enum(['GOLD', 'SILVER', 'STOCK', 'MUTUAL_FUND']),
  mode: z.enum(['LUMPSUM', 'SIP']).default('LUMPSUM'),
  ticker: z.string().max(20, 'Ticker too long').optional(),
  exchange: z.enum(['NSE', 'BSE']).optional(),
  quantity: z.number().positive('Quantity must be positive').optional(),
  quantityGrams: z.number().positive('Grams must be positive').optional(),
  investedAmount: z.number().positive('Invested amount must be positive'),
  currentPrice: z.number().positive('Current price must be positive').optional(),
  currentValue: z.number().positive('Current value must be positive').optional(),
  sipAmount: z.number().positive('SIP amount must be positive').optional(),
  sipDayOfMonth: z.number().int().min(1).max(31).optional(),
  startDate: z.coerce.date(),
  nextSipDate: z.coerce.date().optional(),
}).superRefine((data, ctx) => {
  if ((data.assetType === 'GOLD' || data.assetType === 'SILVER') && !data.quantityGrams) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Gold and silver holdings must include grams', path: ['quantityGrams'] });
  }
  if (data.assetType === 'STOCK' && !data.exchange) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Stocks must include exchange (NSE or BSE)', path: ['exchange'] });
  }
  if (data.mode === 'SIP' && !data.sipAmount) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'SIP amount is required when mode is SIP', path: ['sipAmount'] });
  }
});

export const depositSchema = z.object({
  name: z.string().min(1, 'Name is required').max(120, 'Name too long'),
  provider: z.string().max(120, 'Provider name too long').optional(),
  type: z.enum(['RECURRING_DEPOSIT', 'FIXED_DEPOSIT']),
  principalAmount: z.number().positive('Principal amount must be positive'),
  interestRate: z.number().min(0, 'Interest rate cannot be negative').max(40, 'Interest rate too high'),
  tenureMonths: z.number().int().positive('Tenure must be at least 1 month').max(600, 'Tenure too long'),
  maturityAmount: z.number().positive('Maturity amount must be positive').optional(),
  startDate: z.coerce.date(),
  maturityDate: z.coerce.date().optional(),
  installmentAmount: z.number().positive('Installment amount must be positive').optional(),
  installmentDay: z.number().int().min(1).max(31).optional(),
});
