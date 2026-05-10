"use server";

import { unstable_noStore as noStore } from "next/cache";
import prisma from "@/_lib/prisma";
import { requireAuthForAction } from "@/_lib/auth-utils";
import {
  simulatePrepayment,
  getLoanInsights,
  generateAmortizationSchedule,
  getEarlyClosureScenarios,
} from "@/_services/finance";
import { getUserIdsForCouple } from "@/_services/finance/couple-service";
import { toLoanData } from "./loans-helpers";

/**
 * Fetch every loan owned by the couple, ordered by most recently created.
 *
 * @returns Result with the loan list, or an error.
 * @remarks Auth: requires session.
 */
export async function getLoans() {
  noStore();
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

/**
 * Fetch a single loan by id, scoped to the couple's loans.
 *
 * @param id - Loan id.
 * @returns The loan when found, otherwise an error result.
 * @remarks Auth: requires session.
 */
export async function getLoan(id: string) {
  noStore();
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

/**
 * Simulate the impact of a one-off prepayment on a loan (interest saved, tenure reduction, etc.).
 *
 * @param id - Loan id.
 * @param prepaymentAmount - Positive amount to apply against the principal.
 * @returns Result with the simulation output, or an error.
 * @remarks Auth: requires session.
 */
export async function simulateLoanPrepayment(id: string, prepaymentAmount: number) {
  noStore();
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

/**
 * Fetch the insights bundle for a loan, including early-closure scenarios at standard prepayment amounts.
 *
 * @param id - Loan id.
 * @returns Result with the insights object plus a `scenarios` array, or an error.
 * @remarks Auth: requires session.
 */
export async function getLoanInsightsAction(id: string) {
  noStore();
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

/**
 * Fetch the amortization schedule for a loan. If a PDF-extracted schedule is stored on the row, that schedule is returned verbatim; otherwise it is computed from the loan parameters.
 *
 * @param id - Loan id.
 * @returns Result with the schedule rows, or an error.
 * @remarks Auth: requires session.
 */
export async function getLoanSchedule(id: string) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const loan = await prisma.loan.findFirst({
      where: { id, userId: { in: await getUserIdsForCouple(user.id) } },
    });

    if (!loan) {
      return { success: false as const, error: "Loan not found" };
    }

    if (Array.isArray(loan.schedule) && (loan.schedule as unknown[]).length > 0) {
      return {
        success: true as const,
        data: loan.schedule as {
          month: number; date: string; emi: number; principal: number; interest: number; balance: number;
          totalPrincipalPaid?: number; totalInterestPaid?: number;
        }[],
      };
    }

    const schedule = generateAmortizationSchedule(toLoanData(loan));

    return { success: true as const, data: schedule };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to generate schedule",
    };
  }
}
