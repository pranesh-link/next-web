"use client";

import { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { getDashboardInsights } from "@/couple/finance/_actions/insights";
import FinanceHeader from "@/couple/_components/layout/FinanceHeader";
import SummaryCard from "@/couple/_components/cards/SummaryCard";
import ProgressCard from "@/couple/_components/cards/ProgressCard";
import MonthlyTrendChart from "@/couple/_components/charts/MonthlyTrendChart";
import CategoryPieChart from "@/couple/_components/charts/CategoryPieChart";
import TransactionTable from "@/couple/_components/tables/TransactionTable";
import LoadingSkeleton from "@/couple/_components/shared/LoadingSkeleton";

/* ── Types ──────────────────────────────────────────── */

type DashboardData = Extract<
  Awaited<ReturnType<typeof getDashboardInsights>>,
  { success: true }
>["data"];

/* ── Styled Components ──────────────────────────────── */

const PageWrapper = styled.div`
  padding: 32px;

  @media (max-width: 768px) {
    padding: 20px;
  }
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-top: 32px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Section = styled.section`
  margin-top: 32px;
`;

const SectionHeader = styled.h2`
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--text-muted);
  margin: 0 0 16px 0;
`;

const HealthScoreWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
`;

const ScoreCircleContainer = styled.div`
  position: relative;
  width: 180px;
  height: 180px;
`;

const ScoreLabel = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const ScoreValue = styled.span<{ $color: string }>`
  font-size: 48px;
  font-weight: 800;
  color: ${(p) => p.$color};
  letter-spacing: -2px;
  line-height: 1;
`;

const ScoreCaption = styled.span`
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 4px;
`;

const FactorsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  width: 100%;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const FactorCard = styled.div`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
`;

const FactorName = styled.p`
  font-size: 13px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-muted);
  margin: 0 0 8px 0;
`;

const FactorScoreRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
`;

const FactorScore = styled.span<{ $color: string }>`
  font-size: 24px;
  font-weight: 700;
  color: ${(p) => p.$color};
`;

const FactorWeight = styled.span`
  font-size: 12px;
  color: var(--text-muted);
`;

const FactorDetail = styled.p`
  font-size: 12px;
  color: var(--text-dim);
  margin: 0;
  line-height: 1.4;
`;

const BudgetGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
`;

const GoalsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
`;

const LoanCard = styled.div`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 32px;
  display: flex;
  align-items: center;
  gap: 24px;

  @media (max-width: 480px) {
    padding: 20px;
    gap: 16px;
    flex-direction: column;
    align-items: flex-start;
  }
`;

const LoanIconWrap = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(239, 68, 68, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--danger);
  flex-shrink: 0;
`;

const LoanStat = styled.div`
  flex: 1;
`;

const LoanStatLabel = styled.p`
  font-size: 13px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-muted);
  margin: 0 0 4px 0;
`;

const LoanStatValue = styled.p`
  font-size: 24px;
  font-weight: 800;
  color: var(--text);
  margin: 0;
  letter-spacing: -1px;
`;

const LoanStatSub = styled.p`
  font-size: 13px;
  color: var(--text-dim);
  margin: 4px 0 0 0;
`;

const ErrorBanner = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  padding: 20px 24px;
  color: var(--danger);
  font-size: 14px;
  text-align: center;
`;

const LoadingWrapper = styled.div`
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  @media (max-width: 768px) {
    padding: 20px;
  }
`;

const LoadingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const LoadingChartsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

/* ── Helpers ────────────────────────────────────────── */

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function getScoreColor(score: number): string {
  if (score > 70) return "var(--success)";
  if (score >= 40) return "#f59e0b";
  return "var(--danger)";
}

/* ── Icons ──────────────────────────────────────────── */

const WalletIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
  </svg>
);

const ArrowUpIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 19V5" />
    <path d="m5 12 7-7 7 7" />
  </svg>
);

const ArrowDownIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14" />
    <path d="m19 12-7 7-7-7" />
  </svg>
);

const PercentIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="5" x2="5" y2="19" />
    <circle cx="6.5" cy="6.5" r="2.5" />
    <circle cx="17.5" cy="17.5" r="2.5" />
  </svg>
);

/* ── Health Score Circle ────────────────────────────── */

function HealthScoreCircle({ score }: { score: number }) {
  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <ScoreCircleContainer>
      <svg width="180" height="180" viewBox="0 0 180 180">
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth="8"
        />
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 90 90)"
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <ScoreLabel>
        <ScoreValue $color={color}>{score}</ScoreValue>
        <ScoreCaption>Health Score</ScoreCaption>
      </ScoreLabel>
    </ScoreCircleContainer>
  );
}

/* ── Page Component ─────────────────────────────────── */

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const result = await getDashboardInsights();
    if (result.success) {
      setData(result.data);
      setError(null);
    } else {
      setError(result.error);
    }
  }, []);

  useEffect(() => {
    async function load() {
      await fetchData();
      setLoading(false);
    }
    load();
  }, [fetchData]);

  if (loading) {
    return (
      <>
        <FinanceHeader title="Dashboard" onRefresh={fetchData} />
        <LoadingWrapper>
          <LoadingGrid>
            {Array.from({ length: 4 }).map((_, i) => (
              <LoadingSkeleton key={i} type="card" />
            ))}
          </LoadingGrid>
          <LoadingChartsGrid>
            <LoadingSkeleton type="chart" />
            <LoadingSkeleton type="chart" />
          </LoadingChartsGrid>
          <LoadingSkeleton type="table" />
        </LoadingWrapper>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <FinanceHeader title="Dashboard" onRefresh={fetchData} />
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
    healthScore,
    monthlyTrends,
    recentTransactions,
  } = data;

  return (
    <>
      <FinanceHeader title="Dashboard" onRefresh={fetchData} />
      <PageWrapper>
        {/* ── Summary Cards ──────────────────────── */}
        <SummaryGrid>
          <SummaryCard
            title="Total Balance"
            value={totalBalance}
            icon={WalletIcon}
          />
          <SummaryCard
            title="Monthly Income"
            value={cashFlow.income}
            icon={ArrowUpIcon}
            trend={{ value: cashFlow.income, isPositive: true }}
          />
          <SummaryCard
            title="Monthly Expenses"
            value={cashFlow.expenses}
            icon={ArrowDownIcon}
            trend={{ value: cashFlow.expenses, isPositive: false }}
          />
          <SummaryCard
            title="Savings Rate"
            value={`${savingsRate}%`}
            icon={PercentIcon}
            trend={{ value: savingsRate, isPositive: savingsRate > 0 }}
          />
        </SummaryGrid>

        {/* ── Charts ─────────────────────────────── */}
        <ChartsGrid>
          <MonthlyTrendChart data={monthlyTrends} />
          <CategoryPieChart data={expenseBreakdown} />
        </ChartsGrid>

        {/* ── Financial Health Score ──────────────── */}
        <Section>
          <SectionHeader>Financial Health</SectionHeader>
          <HealthScoreWrapper>
            <HealthScoreCircle score={healthScore.score} />
            <FactorsGrid>
              {healthScore.factors.map((factor) => (
                <FactorCard key={factor.name}>
                  <FactorName>{factor.name}</FactorName>
                  <FactorScoreRow>
                    <FactorScore $color={getScoreColor(factor.score)}>
                      {factor.score}
                    </FactorScore>
                    <FactorWeight>/ 100 ({(factor.weight * 100).toFixed(0)}%)</FactorWeight>
                  </FactorScoreRow>
                  <FactorDetail>{factor.detail}</FactorDetail>
                </FactorCard>
              ))}
            </FactorsGrid>
          </HealthScoreWrapper>
        </Section>

        {/* ── Budget Status ──────────────────────── */}
        {budgetStatus.length > 0 && (
          <Section>
            <SectionHeader>Budget Status</SectionHeader>
            <BudgetGrid>
              {budgetStatus.map((item) => (
                <ProgressCard
                  key={item.budget.id}
                  title={item.budget.category}
                  current={item.spent}
                  target={item.budget.limit}
                  color={item.exceeded ? "var(--danger)" : undefined}
                />
              ))}
            </BudgetGrid>
          </Section>
        )}

        {/* ── Active Loans ───────────────────────── */}
        {loansSummary.count > 0 && (
          <Section>
            <SectionHeader>Active Loans</SectionHeader>
            <LoanCard>
              <LoanIconWrap>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 17a5 5 0 0 0 10 0c0-2.76-2.24-5-5-5s-5 2.24-5 5Z" />
                  <path d="M12 17a5 5 0 0 0 10 0c0-2.76-2.24-5-5-5s-5 2.24-5 5Z" />
                  <path d="M7 7h10" />
                  <path d="M7 3h10" />
                </svg>
              </LoanIconWrap>
              <LoanStat>
                <LoanStatLabel>Active Loans</LoanStatLabel>
                <LoanStatValue>{loansSummary.count}</LoanStatValue>
              </LoanStat>
              <LoanStat>
                <LoanStatLabel>Remaining Balance</LoanStatLabel>
                <LoanStatValue>{formatCurrency(loansSummary.totalRemaining)}</LoanStatValue>
                <LoanStatSub>
                  Monthly EMI: {formatCurrency(loansSummary.totalEMI)}
                </LoanStatSub>
              </LoanStat>
            </LoanCard>
          </Section>
        )}

        {/* ── Goals Progress ─────────────────────── */}
        {goalsWithProgress.length > 0 && (
          <Section>
            <SectionHeader>Goals Progress</SectionHeader>
            <GoalsGrid>
              {goalsWithProgress.map((goal) => (
                <ProgressCard
                  key={goal.id}
                  title={goal.name}
                  current={goal.currentAmount}
                  target={goal.targetAmount}
                  deadline={
                    goal.deadline
                      ? new Date(goal.deadline).toLocaleDateString("en-IN", {
                          month: "short",
                          year: "numeric",
                        })
                      : undefined
                  }
                />
              ))}
            </GoalsGrid>
          </Section>
        )}

        {/* ── Recent Transactions ────────────────── */}
        {recentTransactions.length > 0 && (
          <Section>
            <SectionHeader>Recent Transactions</SectionHeader>
            <TransactionTable
              transactions={recentTransactions.map((tx: any) => ({
                id: tx.id,
                amount: tx.amount,
                type: tx.type as "INCOME" | "EXPENSE",
                category: tx.category,
                description: tx.description ?? "",
                date: tx.date.toISOString(),
                accountName: tx.account?.name,
              }))}
            />
          </Section>
        )}
      </PageWrapper>
    </>
  );
}
