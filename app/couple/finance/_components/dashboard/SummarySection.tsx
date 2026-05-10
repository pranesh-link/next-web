"use client";

import SummaryCard from "@/couple/_components/cards/SummaryCard";
import { SummaryGrid } from "./DashboardClient.styled";
import {
  WalletIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PercentIcon,
  GemIcon,
  VaultIcon,
} from "./icons";
import type { DashboardData } from "./types";

type Props = {
  totalBalance: DashboardData["totalBalance"];
  cashFlow: DashboardData["cashFlow"];
  savingsRate: DashboardData["savingsRate"];
  investmentsSummary: DashboardData["investmentsSummary"];
  depositsSummary: DashboardData["depositsSummary"];
};

export default function SummarySection({
  totalBalance,
  cashFlow,
  savingsRate,
  investmentsSummary,
  depositsSummary,
}: Props) {
  return (
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
      <SummaryCard
        title="Investments"
        value={investmentsSummary.currentValue}
        icon={GemIcon}
        trend={{
          value: investmentsSummary.currentValue - investmentsSummary.totalInvested,
          isPositive:
            investmentsSummary.currentValue - investmentsSummary.totalInvested >= 0,
        }}
      />
      <SummaryCard
        title="Active Deposits"
        value={depositsSummary.totalPrincipal}
        icon={VaultIcon}
        trend={{ value: depositsSummary.activeCount, isPositive: true }}
      />
    </SummaryGrid>
  );
}
