"use client";

import styled from "styled-components";
import { EASING } from "@/couple/_constants/theme";
import { Section, SectionHeader } from "./DashboardClient.styled";
import { formatCurrency } from "./utils";
import type { DashboardData } from "./types";

/** Props for the {@link AccountBreakdownSection} component. */
interface AccountBreakdownSectionProps {
  /** Account balances grouped by type. */
  accountBreakdown: DashboardData["accountBreakdown"];
  /** Total net worth across all accounts. */
  netWorth: DashboardData["netWorth"];
}

/**
 * Convert an account type enum value to a human-readable label.
 *
 * @param type - The raw account type string (e.g. "SAVINGS_ACCOUNT").
 * @returns A formatted label (e.g. "Savings Account").
 */
export function formatAccountType(type: string): string {
  const map: Record<string, string> = {
    SAVINGS_ACCOUNT: "Savings",
    CHECKING_ACCOUNT: "Checking",
    CREDIT_ACCOUNT: "Credit",
    CREDIT_CARD: "Credit Card",
    RECURRING_DEPOSIT: "Recurring Deposit",
    FIXED_DEPOSIT: "Fixed Deposit",
    INVESTMENT: "Investment",
    LOAN: "Loan",
    CASH: "Cash",
    OTHER: "Other",
  };

  if (map[type]) return map[type];

  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const NetWorthBanner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  margin-bottom: 16px;

  @media (max-width: 480px) {
    padding: 12px 14px;
    flex-direction: column;
    gap: 4px;
    align-items: flex-start;
  }
`;

const NetWorthLabel = styled.span`
  font-size: 0.875rem;
  color: var(--text-muted);
  font-weight: 500;
`;

const NetWorthValue = styled.span`
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text);

  @media (max-width: 480px) {
    font-size: 1.125rem;
  }
`;

const BreakdownGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const AccountCard = styled.div`
  padding: 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  transition: border-color 0.2s ${EASING};

  &:hover {
    border-color: var(--accent);
  }

  @media (max-width: 480px) {
    padding: 14px;
  }
`;

const AccountTypeName = styled.div`
  font-size: 0.8125rem;
  color: var(--text-muted);
  margin-bottom: 6px;
  font-weight: 500;
`;

const AccountTotal = styled.div`
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 4px;

  @media (max-width: 480px) {
    font-size: 1rem;
  }
`;

const AccountCount = styled.div`
  font-size: 0.75rem;
  color: var(--text-muted);
`;

/**
 * Display account balances grouped by account type with a net worth summary.
 *
 * @param props - Component props.
 * @param props.accountBreakdown - Array of account type summaries.
 * @param props.netWorth - Total net worth value.
 * @returns The account breakdown section, or null when there is no data.
 */
export default function AccountBreakdownSection({
  accountBreakdown,
  netWorth,
}: AccountBreakdownSectionProps) {
  if (!accountBreakdown || accountBreakdown.length === 0) return null;

  return (
    <Section>
      <SectionHeader>Account Breakdown</SectionHeader>
      <NetWorthBanner>
        <NetWorthLabel>Net Worth</NetWorthLabel>
        <NetWorthValue>{formatCurrency(netWorth)}</NetWorthValue>
      </NetWorthBanner>
      <BreakdownGrid>
        {accountBreakdown.map((item) => (
          <AccountCard key={item.type}>
            <AccountTypeName>
              {formatAccountType(item.type)}
            </AccountTypeName>
            <AccountTotal>{formatCurrency(item.total)}</AccountTotal>
            <AccountCount>
              {item.count} {item.count === 1 ? "account" : "accounts"}
            </AccountCount>
          </AccountCard>
        ))}
      </BreakdownGrid>
    </Section>
  );
}
