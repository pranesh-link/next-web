"use client";

import HealthScoreCircle from "./HealthScoreCircle";
import {
  Section,
  SectionHeader,
  HealthScoreWrapper,
  FactorsGrid,
  FactorCard,
  FactorName,
  FactorScoreRow,
  FactorScore,
  FactorWeight,
  FactorDetail,
} from "./DashboardClient.styled";
import { getScoreColor } from "./utils";
import type { DashboardData } from "./types";

export default function HealthSection({
  healthScore,
}: {
  healthScore: DashboardData["healthScore"];
}) {
  return (
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
  );
}
