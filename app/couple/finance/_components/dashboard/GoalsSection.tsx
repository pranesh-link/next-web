"use client";

import styled from "styled-components";
import ProgressCard from "@/couple/_components/cards/ProgressCard";
import { Section, SectionHeader, GoalsGrid } from "./DashboardClient.styled";
import type { DashboardData } from "./types";

const inrFormat = new Intl.NumberFormat("en-IN");

/** Wrapper for a ProgressCard and its timeline info. */
const GoalCardWrapper = styled.div``;

/** Small red badge indicating a goal is at risk. */
const GoalRiskBadge = styled.span`
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  color: var(--danger);
  background: rgba(239, 68, 68, 0.15);
  border-radius: 6px;
  padding: 2px 8px;
  margin-top: 6px;
`;

/** Flex row displaying timeline data below a goal card. */
const GoalTimelineInfo = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-muted);
`;

/** Single data point within the timeline row. */
const GoalTimelineItem = styled.span``;

/** Dashboard section displaying savings goals with timeline and risk info. */
export default function GoalsSection({
  goalsWithTimeline,
}: {
  goalsWithTimeline: DashboardData["goalsWithTimeline"];
}) {
  if (goalsWithTimeline.length === 0) return null;

  return (
    <Section>
      <SectionHeader>Goals Progress</SectionHeader>
      <GoalsGrid>
        {goalsWithTimeline.map((goal) => (
          <GoalCardWrapper key={goal.id}>
            <ProgressCard
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
            {goal.isAtRisk && <GoalRiskBadge>At Risk</GoalRiskBadge>}
            <GoalTimelineInfo>
              {goal.monthsLeft !== null && (
                <GoalTimelineItem>
                  {goal.monthsLeft} months left
                </GoalTimelineItem>
              )}
              {goal.monthlySavingsNeeded !== null && (
                <GoalTimelineItem>
                  Need ₹{inrFormat.format(goal.monthlySavingsNeeded)}/mo
                </GoalTimelineItem>
              )}
            </GoalTimelineInfo>
          </GoalCardWrapper>
        ))}
      </GoalsGrid>
    </Section>
  );
}
