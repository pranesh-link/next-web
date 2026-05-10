"use client";

import ProgressCard from "@/couple/_components/cards/ProgressCard";
import { Section, SectionHeader, BudgetGrid } from "./DashboardClient.styled";
import type { DashboardData } from "./types";

export default function BudgetsSection({
  budgetStatus,
}: {
  budgetStatus: DashboardData["budgetStatus"];
}) {
  if (budgetStatus.length === 0) return null;

  return (
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
  );
}
