"use client";

import styled from "styled-components";
import {
  ScoreCircleContainer,
  ScoreLabel,
  ScoreValue,
  ScoreCaption,
} from "./DashboardClient.styled";
import { getScoreColor } from "./utils";

const AnimatedProgressCircle = styled.circle`
  transition: stroke-dashoffset 1s ease-out;
`;

export default function HealthScoreCircle({ score }: { score: number }) {
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
        <AnimatedProgressCircle
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
        />
      </svg>
      <ScoreLabel>
        <ScoreValue $color={color}>{score}</ScoreValue>
        <ScoreCaption>Health Score</ScoreCaption>
      </ScoreLabel>
    </ScoreCircleContainer>
  );
}
