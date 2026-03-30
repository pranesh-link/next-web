"use server";

import prisma from "@/_lib/prisma";
import { requireAuthForAction } from "@/_lib/auth-utils";
import { loanSchema } from "@/_lib/validations/finance";
import {
  calculateEMI,
  simulatePrepayment,
  getLoanInsights,
  generateAmortizationSchedule,
  getEarlyClosureScenarios,
} from "@/_services/finance";
import type { LoanData } from "@/_services/finance";
import { getUserIdsForCouple, getCoupleIdForUser } from "@/_services/finance/couple-service";
import { invalidateAfterLoanChange } from "@/_lib/cache";

export async function getLoans() {
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);

    const loans = await prisma.loan.findMany({
      where: { userId: { in: coupleUserIds } },
      orderBy: { createdAt: "desc" },
    });

    return { success: true as const, data: loans };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to fetch loans",
    };
  }
}

export async function getLoan(id: string) {
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const loan = await prisma.loan.findFirst({
      where: { id, userId: { in: await getUserIdsForCouple(user.id) } },
    });

    if (!loan) {
      return { success: false as const, error: "Loan not found" };
    }

    return { success: true as const, data: loan };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to fetch loan",
    };
  }
}

export async function createLoan(data: {
  name: string;
  loanProvider?: string;
  principal: number;
  interestRate: number;
  tenureMonths: number;
  emiAmount: number;
  startDate: string | Date;
  remainingBalance: number;
  loanAccountNumber?: string;
  scheduleGeneratedOn?: string;
  prepayments?: { date: string; amount: number; balanceAfter?: number }[];
  schedule?: { month: number; date: string; emi: number; principal: number; interest: number; balance: number }[];
}) {
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);

    // Duplicate check: prefer loanAccountNumber, fallback to name+principal+rate+tenure
    const duplicate = data.loanAccountNumber
      ? await prisma.loan.findFirst({
          where: {
            userId: { in: coupleUserIds },
            loanAccountNumber: data.loanAccountNumber,
          },
        })
      : await prisma.loan.findFirst({
          where: {
            userId: { in: coupleUserIds },
            name: data.name,
            principal: data.principal,
            interestRate: data.interestRate,
            tenureMonths: data.tenureMonths,
          },
        });

    if (duplicate) {
      return {
        success: false as const,
        error: data.loanAccountNumber
          ? `A loan with account number "${data.loanAccountNumber}" already exists`
          : `A loan "${data.name}" with the same principal, rate, and tenure already exists`,
      };
    }

    // Auto-calculate EMI if not provided
    let emiAmount = data.emiAmount;
    if (emiAmount === 0) {
      emiAmount = calculateEMI(data.principal, data.interestRate, data.tenureMonths);
    }

    const validated = loanSchema.parse({ ...data, emiAmount });

    const coupleId = await getCoupleIdForUser(user.id);

    const loan = await prisma.loan.create({
      data: {
        userId: user.id,
        name: validated.name,
        loanProvider: validated.loanProvider || null,
        loanAccountNumber: validated.loanAccountNumber || null,
        scheduleGeneratedOn: validated.scheduleGeneratedOn || null,
        principal: validated.principal,
        interestRate: validated.interestRate,
        tenureMonths: validated.tenureMonths,
        emiAmount: validated.emiAmount,
        startDate: validated.startDate,
        remainingBalance: validated.remainingBalance,
        ...(validated.prepayments && validated.prepayments.length > 0
          ? { prepayments: validated.prepayments }
          : {}),
        ...(validated.schedule && validated.schedule.length > 0
          ? { schedule: validated.schedule }
          : {}),
        ...(coupleId ? { coupleId } : {}),
      },
    });

    invalidateAfterLoanChange();
    return { success: true as const, data: loan };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to create loan",
    };
  }
}

export async function updateLoan(
  id: string,
  data: {
    name?: string;
    loanProvider?: string;
    principal?: number;
    interestRate?: number;
    tenureMonths?: number;
    emiAmount?: number;
    startDate?: string | Date;
    remainingBalance?: number;
    loanAccountNumber?: string;
    scheduleGeneratedOn?: string;
    prepayments?: { date: string; amount: number; balanceAfter?: number }[];
    schedule?: { month: number; date: string; emi: number; principal: number; interest: number; balance: number }[];
  },
) {
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const existing = await prisma.loan.findFirst({
      where: { id, userId: { in: await getUserIdsForCouple(user.id) } },
    });

    if (!existing) {
      return { success: false as const, error: "Loan not found" };
    }

    const merged = {
      name: data.name ?? existing.name,
      loanProvider: data.loanProvider ?? (existing.loanProvider ?? undefined),
      loanAccountNumber: data.loanAccountNumber ?? (existing.loanAccountNumber ?? undefined),
      scheduleGeneratedOn: data.scheduleGeneratedOn ?? (existing.scheduleGeneratedOn ?? undefined),
      principal: data.principal ?? existing.principal,
      interestRate: data.interestRate ?? existing.interestRate,
      tenureMonths: data.tenureMonths ?? existing.tenureMonths,
      emiAmount: data.emiAmount ?? existing.emiAmount,
      startDate: data.startDate ?? existing.startDate,
      remainingBalance: data.remainingBalance ?? existing.remainingBalance,
      prepayments: data.prepayments ?? (existing.prepayments as { date: string; amount: number; balanceAfter?: number }[] | null) ?? undefined,
      schedule: data.schedule ?? (existing.schedule as { month: number; date: string; emi: number; principal: number; interest: number; balance: number }[] | null) ?? undefined,
    };

    const validated = loanSchema.parse(merged);

    const loan = await prisma.loan.update({
      where: { id },
      data: {
        name: validated.name,
        loanProvider: validated.loanProvider || null,
        loanAccountNumber: validated.loanAccountNumber || null,
        scheduleGeneratedOn: validated.scheduleGeneratedOn || null,
        principal: validated.principal,
        interestRate: validated.interestRate,
        tenureMonths: validated.tenureMonths,
        emiAmount: validated.emiAmount,
        startDate: validated.startDate,
        remainingBalance: validated.remainingBalance,
        prepayments: validated.prepayments && validated.prepayments.length > 0
          ? validated.prepayments
          : undefined,
        schedule: validated.schedule && validated.schedule.length > 0
          ? validated.schedule
          : undefined,
      },
    });

    invalidateAfterLoanChange();
    return { success: true as const, data: loan };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to update loan",
    };
  }
}

export async function deleteLoan(id: string) {
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const existing = await prisma.loan.findFirst({
      where: { id, userId: { in: await getUserIdsForCouple(user.id) } },
    });

    if (!existing) {
      return { success: false as const, error: "Loan not found" };
    }

    await prisma.loan.delete({ where: { id } });

    invalidateAfterLoanChange();
    return { success: true as const, data: { id } };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to delete loan",
    };
  }
}

function toLoanData(loan: {
  id: string;
  name: string;
  principal: number;
  interestRate: number;
  tenureMonths: number;
  emiAmount: number;
  startDate: Date;
  remainingBalance: number;
  prepayments?: unknown;
}): LoanData {
  return {
    id: loan.id,
    name: loan.name,
    principal: loan.principal,
    interestRate: loan.interestRate,
    tenureMonths: loan.tenureMonths,
    emiAmount: loan.emiAmount,
    startDate: loan.startDate,
    remainingBalance: loan.remainingBalance,
    ...(Array.isArray(loan.prepayments) ? { prepayments: loan.prepayments as LoanData['prepayments'] } : {}),
  };
}

export async function simulateLoanPrepayment(
  id: string,
  prepaymentAmount: number,
) {
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const loan = await prisma.loan.findFirst({
      where: { id, userId: { in: await getUserIdsForCouple(user.id) } },
    });

    if (!loan) {
      return { success: false as const, error: "Loan not found" };
    }

    if (prepaymentAmount <= 0) {
      return { success: false as const, error: "Prepayment amount must be positive" };
    }

    const result = simulatePrepayment(toLoanData(loan), prepaymentAmount);

    return { success: true as const, data: result };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to simulate prepayment",
    };
  }
}

export async function getLoanInsightsAction(id: string) {
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const loan = await prisma.loan.findFirst({
      where: { id, userId: { in: await getUserIdsForCouple(user.id) } },
    });

    if (!loan) {
      return { success: false as const, error: "Loan not found" };
    }

    const result = getLoanInsights(toLoanData(loan));
    const scenarios = getEarlyClosureScenarios(toLoanData(loan), [5000, 10000, 25000, 50000]);

    return { success: true as const, data: { ...result, scenarios } };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to get loan insights",
    };
  }
}

export async function getLoanSchedule(id: string) {
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const loan = await prisma.loan.findFirst({
      where: { id, userId: { in: await getUserIdsForCouple(user.id) } },
    });

    if (!loan) {
      return { success: false as const, error: "Loan not found" };
    }

    // If a PDF-extracted schedule is stored in the DB, return it directly
    if (Array.isArray(loan.schedule) && (loan.schedule as unknown[]).length > 0) {
      return { success: true as const, data: loan.schedule as {
        month: number; date: string; emi: number; principal: number; interest: number; balance: number;
        totalPrincipalPaid?: number; totalInterestPaid?: number;
      }[] };
    }

    // Fallback: compute amortization schedule from loan parameters
    const schedule = generateAmortizationSchedule(toLoanData(loan));

    return { success: true as const, data: schedule };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to generate schedule",
    };
  }
}

export async function addPrepayment(
  loanId: string,
  data: { date: string; amount: number },
) {
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);
    const loan = await prisma.loan.findFirst({
      where: { id: loanId, userId: { in: coupleUserIds } },
    });

    if (!loan) return { success: false as const, error: "Loan not found" };

    // Validate date is between loan start and today
    const prepayDate = new Date(data.date);
    const loanStart = new Date(loan.startDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    loanStart.setHours(0, 0, 0, 0);
    prepayDate.setHours(0, 0, 0, 0);

    if (prepayDate < loanStart || prepayDate > today) {
      return { success: false as const, error: "Prepayment date must be between loan start date and today" };
    }

    if (data.amount <= 0) {
      return { success: false as const, error: "Prepayment amount must be positive" };
    }

    if (data.amount > loan.remainingBalance) {
      return { success: false as const, error: "Prepayment amount exceeds remaining balance" };
    }

    const existing = Array.isArray(loan.prepayments)
      ? (loan.prepayments as { date: string; amount: number; balanceAfter?: number; source?: string }[])
      : [];

    const newBalance = loan.remainingBalance - data.amount;

    const newPrepayment = {
      date: data.date,
      amount: data.amount,
      balanceAfter: Math.round(newBalance * 100) / 100,
      source: "manual" as const,
    };

    // Add and sort descending by date (recent first)
    const updated = [...existing, newPrepayment].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    await prisma.loan.update({
      where: { id: loanId },
      data: {
        prepayments: updated,
        remainingBalance: Math.round(newBalance * 100) / 100,
      },
    });

    invalidateAfterLoanChange();
    return { success: true as const };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to add prepayment",
    };
  }
}

export async function removePrepayment(loanId: string, index: number) {
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);
    const loan = await prisma.loan.findFirst({
      where: { id: loanId, userId: { in: coupleUserIds } },
    });

    if (!loan) return { success: false as const, error: "Loan not found" };

    const existing = Array.isArray(loan.prepayments)
      ? (loan.prepayments as { date: string; amount: number; balanceAfter?: number; source?: string }[])
      : [];

    if (index < 0 || index >= existing.length) {
      return { success: false as const, error: "Invalid prepayment index" };
    }

    const target = existing[index];

    // Only manual prepayments can be removed (no source or source=scanned means scanned)
    if (!target.source || target.source === "scanned") {
      return { success: false as const, error: "Cannot remove scanned prepayments — they were extracted from your loan statement" };
    }

    const restoredBalance = loan.remainingBalance + target.amount;
    const updated = existing.filter((_, i) => i !== index);

    await prisma.loan.update({
      where: { id: loanId },
      data: {
        prepayments: updated.length > 0 ? updated : [],
        remainingBalance: Math.round(restoredBalance * 100) / 100,
      },
    });

    invalidateAfterLoanChange();
    return { success: true as const };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to remove prepayment",
    };
  }
}
