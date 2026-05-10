"use client";

import {
  Section,
  SectionHeader,
  LoanCard,
  LoanIconWrap,
  LoanStat,
  LoanStatLabel,
  LoanStatValue,
  LoanStatSub,
} from "./DashboardClient.styled";
import { LoanCoinsIcon } from "./icons";
import { formatCurrency } from "./utils";
import type { DashboardData } from "./types";

export default function LoansSection({
  loansSummary,
}: {
  loansSummary: DashboardData["loansSummary"];
}) {
  if (loansSummary.count === 0) return null;

  return (
    <Section>
      <SectionHeader>Active Loans</SectionHeader>
      <LoanCard>
        <LoanIconWrap>{LoanCoinsIcon}</LoanIconWrap>
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
  );
}
