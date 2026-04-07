"use client";

import React from "react";
import styled from "styled-components";

interface TrendData {
  value: number;
  isPositive: boolean;
}

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: TrendData;
  className?: string;
}

const EASING = "cubic-bezier(0.16, 1, 0.3, 1)";

function formatCurrency(value: string | number): string {
  if (typeof value === "string") return value;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
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

const CardInner = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
`;

const Content = styled.div`
  min-width: 0;
  flex: 1;
`;

const CardTitle = styled.p`
  font-size: 13px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-muted);
  margin: 0 0 8px 0;
`;

const Value = styled.p`
  font-size: 28px;
  font-weight: 800;
  color: var(--text);
  letter-spacing: -1px;
  margin: 0;

  @media (max-width: 480px) {
    font-size: 22px;
  }
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
`;

const TrendPill = styled.span<{ $positive: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  background: ${(p) =>
    p.$positive ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)"};
  color: ${(p) => (p.$positive ? "var(--success)" : "var(--danger)")};

  svg {
    width: 12px;
    height: 12px;
  }
`;

const Subtitle = styled.span`
  font-size: 12px;
  color: var(--text-muted);
`;

const IconWrap = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(59, 130, 246, 0.1);
  color: var(--accent-light);
  flex-shrink: 0;
  margin-left: 16px;
`;

export default function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  className,
}: SummaryCardProps) {
  const displayValue = typeof value === "number" ? formatCurrency(value) : value;

  return (
    <Card className={className}>
      <CardInner>
        <Content>
          <CardTitle>{title}</CardTitle>
          <Value>{displayValue}</Value>
          {(subtitle || trend) && (
            <MetaRow>
              {trend && (
                <TrendPill $positive={trend.isPositive}>
                  {trend.isPositive ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="18 15 12 9 6 15" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  )}
                  {Math.abs(trend.value)}%
                </TrendPill>
              )}
              {subtitle && <Subtitle>{subtitle}</Subtitle>}
            </MetaRow>
          )}
        </Content>
        {icon && <IconWrap>{icon}</IconWrap>}
      </CardInner>
    </Card>
  );
}
