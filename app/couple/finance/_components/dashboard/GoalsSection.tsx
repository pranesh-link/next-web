"use client";

import ProgressCard from "@/couple/_components/cards/ProgressCard";
import { Section, SectionHeader, GoalsGrid } from "./DashboardClient.styled";
import type { DashboardData } from "./types";

export default function GoalsSection({
  goalsWithProgress,
}: {
  goalsWithProgress: DashboardData["goalsWithProgress"];
}) {
  if (goalsWithProgress.length === 0) return null;

  return (
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
  );
}
