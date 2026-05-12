"use client";

import { useCallback, useState, useTransition } from "react";
import { getDashboardInsights } from "@/couple/finance/_actions/insights";
import FinanceHeader from "@/couple/_components/layout/FinanceHeader";
import MonthlyTrendChart from "@/couple/_components/charts/MonthlyTrendChart";
import CategoryPieChart from "@/couple/_components/charts/CategoryPieChart";
import {
  PageWrapper,
  ChartsGrid,
  ErrorBanner,
} from "./dashboard/DashboardClient.styled";
import SummarySection from "./dashboard/SummarySection";
import HealthSection from "./dashboard/HealthSection";
import BudgetsSection from "./dashboard/BudgetsSection";
import LoansSection from "./dashboard/LoansSection";
import GoalsSection from "./dashboard/GoalsSection";
import RecentTransactionsSection from "./dashboard/RecentTransactionsSection";
import BudgetVsActualsWidget from "./BudgetVsActualsWidget";
import type { DashboardData } from "./dashboard/types";

export default function DashboardClient({
  initialData,
  initialError,
}: {
  initialData: DashboardData | null;
  initialError: string | null;
}) {
  const [data, setData] = useState<DashboardData | null>(initialData);
  const [error, setError] = useState<string | null>(initialError);
  const [isPending, startTransition] = useTransition();

  const handleRefresh = useCallback(async () => {
    startTransition(async () => {
      const result = await getDashboardInsights();
      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error);
      }
    });
  }, []);

  if (error || !data) {
    return (
      <>
        <FinanceHeader title="Dashboard" onRefresh={handleRefresh} />
        <PageWrapper>
          <ErrorBanner>{error ?? "Failed to load dashboard data."}</ErrorBanner>
        </PageWrapper>
      </>
    );
  }

  const {
    totalBalance,
    cashFlow,
    savingsRate,
    expenseBreakdown,
    budgetStatus,
    loansSummary,
    goalsWithProgress,
    investmentsSummary,
    depositsSummary,
    healthScore,
    monthlyTrends,
    recentTransactions,
  } = data;

  return (
    <>
      <FinanceHeader title="Dashboard" onRefresh={handleRefresh} />
      <PageWrapper $pending={isPending}>
        <SummarySection
          totalBalance={totalBalance}
          cashFlow={cashFlow}
          savingsRate={savingsRate}
          investmentsSummary={investmentsSummary}
          depositsSummary={depositsSummary}
        />

        <ChartsGrid>
          <MonthlyTrendChart data={monthlyTrends} />
          <CategoryPieChart data={expenseBreakdown} />
        </ChartsGrid>

        <BudgetVsActualsWidget />

        <HealthSection healthScore={healthScore} />
        <BudgetsSection budgetStatus={budgetStatus} />
        <LoansSection loansSummary={loansSummary} />
        <GoalsSection goalsWithProgress={goalsWithProgress} />
        <RecentTransactionsSection recentTransactions={recentTransactions} />
      </PageWrapper>
    </>
  );
}
