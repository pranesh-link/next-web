"use server";

import prisma from "@/_lib/prisma";
import { requireAuthForAction } from "@/_lib/auth-utils";
import { loanSchema } from "@/_lib/validations/finance";
import {
  calculateEMI,
  simulatePrepayment,
  getLoanInsights,
} from "@/_services/finance";
import type { LoanData } from "@/_services/finance";

export async function getLoans() {
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const loans = await prisma.loan.findMany({
      where: { userId: user.id },
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
      where: { id, userId: user.id },
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
  principal: number;
  interestRate: number;
  tenureMonths: number;
  emiAmount: number;
  startDate: string | Date;
  remainingBalance: number;
}) {
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    // Auto-calculate EMI if not provided
    let emiAmount = data.emiAmount;
    if (emiAmount === 0) {
      emiAmount = calculateEMI(data.principal, data.interestRate, data.tenureMonths);
    }

    const validated = loanSchema.parse({ ...data, emiAmount });

    const loan = await prisma.loan.create({
      data: {
        userId: user.id,
        name: validated.name,
        principal: validated.principal,
        interestRate: validated.interestRate,
        tenureMonths: validated.tenureMonths,
        emiAmount: validated.emiAmount,
        startDate: validated.startDate,
        remainingBalance: validated.remainingBalance,
      },
    });

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
    principal?: number;
    interestRate?: number;
    tenureMonths?: number;
    emiAmount?: number;
    startDate?: string | Date;
    remainingBalance?: number;
  },
) {
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const existing = await prisma.loan.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return { success: false as const, error: "Loan not found" };
    }

    const merged = {
      name: data.name ?? existing.name,
      principal: data.principal ?? existing.principal,
      interestRate: data.interestRate ?? existing.interestRate,
      tenureMonths: data.tenureMonths ?? existing.tenureMonths,
      emiAmount: data.emiAmount ?? existing.emiAmount,
      startDate: data.startDate ?? existing.startDate,
      remainingBalance: data.remainingBalance ?? existing.remainingBalance,
    };

    const validated = loanSchema.parse(merged);

    const loan = await prisma.loan.update({
      where: { id },
      data: {
        name: validated.name,
        principal: validated.principal,
        interestRate: validated.interestRate,
        tenureMonths: validated.tenureMonths,
        emiAmount: validated.emiAmount,
        startDate: validated.startDate,
        remainingBalance: validated.remainingBalance,
      },
    });

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
      where: { id, userId: user.id },
    });

    if (!existing) {
      return { success: false as const, error: "Loan not found" };
    }

    await prisma.loan.delete({ where: { id } });

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
      where: { id, userId: user.id },
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
      where: { id, userId: user.id },
    });

    if (!loan) {
      return { success: false as const, error: "Loan not found" };
    }

    const result = getLoanInsights(toLoanData(loan));

    return { success: true as const, data: result };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to get loan insights",
    };
  }
}
