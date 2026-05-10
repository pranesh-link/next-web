"use client";

import TransactionTable from "@/couple/_components/tables/TransactionTable";
import { Section, SectionHeader } from "./DashboardClient.styled";
import type { DashboardData } from "./types";

export default function RecentTransactionsSection({
  recentTransactions,
}: {
  recentTransactions: DashboardData["recentTransactions"];
}) {
  if (recentTransactions.length === 0) return null;

  return (
    <Section>
      <SectionHeader>Recent Transactions</SectionHeader>
      <TransactionTable
        transactions={recentTransactions.map(
          (tx: DashboardData["recentTransactions"][number]) => ({
            id: tx.id,
            amount: tx.amount,
            type: tx.type as "INCOME" | "EXPENSE",
            category: tx.category,
            description: tx.description ?? "",
            date:
              typeof tx.date === "string"
                ? tx.date
                : new Date(tx.date).toISOString(),
            accountName: tx.account?.name,
          })
        )}
      />
    </Section>
  );
}
