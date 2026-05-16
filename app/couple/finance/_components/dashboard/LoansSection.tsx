"use client";

import styled from "styled-components";
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

/** CSS grid for individual loan detail cards. */
const LoanDetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 16px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

/** Card displaying a single loan's details. */
const LoanDetailCard = styled.div`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
`;

/** Loan name heading inside a detail card. */
const LoanDetailName = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 12px;
`;

/** Flex row for label–value pairs inside a detail card. */
const LoanDetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
`;

/** Muted label text inside a detail row. */
const LoanDetailLabel = styled.span`
  font-size: 13px;
  color: var(--text-muted);
`;

/** Value text inside a detail row. */
const LoanDetailValue = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
`;

/** Props for the loans dashboard section. */
type Props = {
  loansSummary: DashboardData["loansSummary"];
  loanDetails: DashboardData["loanDetails"];
};

/** Renders the active loans summary card and individual loan detail cards. */
export default function LoansSection({ loansSummary, loanDetails }: Props) {
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
      {loanDetails.length > 0 && (
        <LoanDetailGrid>
          {loanDetails.map((loan) => (
            <LoanDetailCard key={loan.id}>
              <LoanDetailName>{loan.name}</LoanDetailName>
              <LoanDetailRow>
                <LoanDetailLabel>Remaining</LoanDetailLabel>
                <LoanDetailValue>{formatCurrency(loan.remainingBalance)}</LoanDetailValue>
              </LoanDetailRow>
              <LoanDetailRow>
                <LoanDetailLabel>Interest Rate</LoanDetailLabel>
                <LoanDetailValue>{loan.interestRate}% p.a.</LoanDetailValue>
              </LoanDetailRow>
              <LoanDetailRow>
                <LoanDetailLabel>Monthly EMI</LoanDetailLabel>
                <LoanDetailValue>{formatCurrency(loan.emiAmount)}</LoanDetailValue>
              </LoanDetailRow>
              <LoanDetailRow>
                <LoanDetailLabel>Next Due</LoanDetailLabel>
                <LoanDetailValue>
                  {loan.nextDueDate
                    ? new Date(loan.nextDueDate).toLocaleDateString("en-IN")
                    : "—"}
                </LoanDetailValue>
              </LoanDetailRow>
            </LoanDetailCard>
          ))}
        </LoanDetailGrid>
      )}
    </Section>
  );
}
