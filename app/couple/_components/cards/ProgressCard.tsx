"use client";

import React from "react";
import styled from "styled-components";

interface ProgressCardProps {
  title: string;
  current: number;
  target: number;
  unit?: string;
  color?: string;
  deadline?: string;
}

const EASING = "cubic-bezier(0.16, 1, 0.3, 1)";

function formatAmount(value: number, unit: string): string {
  if (unit === "\u20b9" || unit === "INR") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  }
  return `${unit}${value.toLocaleString("en-IN")}`;
}

const Card = styled.div`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 32px;
  transition: all 0.3s ${EASING};
  cursor: default;

  &:hover {
    border-color: rgba(59, 130, 246, 0.3);
    background: var(--surface-hover);
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(59, 130, 246, 0.1);
  }

  @media (max-width: 768px) {
    padding: 24px;
    border-radius: 12px;
  }

  @media (max-width: 480px) {
    padding: 20px;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const Title = styled.h3`
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  margin: 0;
`;

const Percentage = styled.span<{ $over: boolean }>`
  font-size: 14px;
  font-weight: 700;
  color: ${(p) => (p.$over ? "var(--danger)" : "var(--accent)")};
`;

const TrackBar = styled.div`
  width: 100%;
  height: 4px;
  border-radius: 4px;
  background: var(--surface-hover);
  overflow: hidden;
`;

const FillBar = styled.div<{ $width: number }>`
  height: 100%;
  border-radius: 4px;
  background: linear-gradient(90deg, var(--accent), #22d3ee);
  width: ${(p) => Math.min(p.$width, 100)}%;
  transition: width 1s ${EASING};
`;

const Amounts = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
`;

const CurrentAmount = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
`;

const TargetAmount = styled.span`
  font-size: 14px;
  color: var(--text-muted);
`;

const Deadline = styled.p`
  font-size: 12px;
  color: var(--text-muted);
  margin: 8px 0 0 0;
`;

export default function ProgressCard({
  title,
  current,
  target,
  unit = "\u20b9",
  deadline,
}: ProgressCardProps) {
  const rawPercentage = target > 0 ? Math.round((current / target) * 100) : 0;
  const isOver = rawPercentage > 100;

  return (
    <Card>
      <Header>
        <Title>{title}</Title>
        <Percentage $over={isOver}>{rawPercentage}%</Percentage>
      </Header>

      <TrackBar>
        <FillBar $width={rawPercentage} />
      </TrackBar>

      <Amounts>
        <CurrentAmount>{formatAmount(current, unit)}</CurrentAmount>
        <TargetAmount>of {formatAmount(target, unit)}</TargetAmount>
      </Amounts>

      {deadline && (
        <Deadline>
          Deadline:{" "}
          {new Date(deadline).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </Deadline>
      )}
    </Card>
  );
}
