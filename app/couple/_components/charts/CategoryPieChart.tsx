'use client';

import styled from 'styled-components';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  type PieLabelRenderProps,
} from 'recharts';
import {
  FinanceCard,
  FinanceCardHeader,
  FinanceCardContent,
} from '../theme/styled-primitives';

interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
}

interface CategoryPieChartProps {
  data: CategoryData[];
}

const COLORS = [
  '#3b82f6',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#f97316',
  '#14b8a6',
  '#a855f7',
];

const ChartContainer = styled.div`
  height: 280px;

  @media screen and (max-width: 480px) {
    height: 240px;
  }
`;

const ChartLayout = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
  gap: 16px;

  @media screen and (max-width: 480px) {
    flex-direction: column;
    gap: 12px;
  }
`;

const PieWrapper = styled.div`
  flex: 1;
  min-width: 0;
  height: 100%;
`;

const LegendList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 140px;

  @media screen and (max-width: 480px) {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    min-width: unset;
  }
`;

const LegendItem = styled.li`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-dim);
  line-height: 1.4;
`;

const LegendDot = styled.span<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${(p) => p.$color};
  flex-shrink: 0;
`;

const LegendPercent = styled.span`
  color: var(--text-muted);
  font-size: 12px;
`;

const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 280px;
  color: var(--text-dim);
  font-size: 14px;
`;

const TooltipWrapper = styled.div`
  background: var(--bg-elevated);
  border: 1px solid var(--border-strong);
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  backdrop-filter: blur(8px);
`;

const TooltipRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 2px 0;
`;

const TooltipDot = styled.span<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${(p) => p.$color};
  display: inline-block;
  margin-right: 6px;
`;

const TooltipName = styled.span`
  font-size: 13px;
  color: var(--text-dim);
`;

const TooltipValue = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
`;

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value);
}

function renderCustomLabel(props: PieLabelRenderProps) {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props as {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    percent: number;
  };
  if (percent * 100 < 5) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight={600}
    >
      {(percent * 100).toFixed(0)}%
    </text>
  );
}

interface TooltipPayloadItem {
  name: string;
  value: number;
  payload: { category: string; amount: number; percentage: number };
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  const colorIndex =
    COLORS.indexOf(entry.payload.category) >= 0 ? 0 : 0;
  return (
    <TooltipWrapper>
      <TooltipRow>
        <span>
          <TooltipDot $color={COLORS[colorIndex]} />
          <TooltipName>{entry.name}</TooltipName>
        </span>
        <TooltipValue>{formatCurrency(entry.value)}</TooltipValue>
      </TooltipRow>
    </TooltipWrapper>
  );
}

export default function CategoryPieChart({ data }: CategoryPieChartProps) {
  return (
    <FinanceCard>
      <FinanceCardHeader>Expense Breakdown</FinanceCardHeader>
      <FinanceCardContent>
        {data.length === 0 ? (
          <EmptyState>No expense data available</EmptyState>
        ) : (
          <ChartContainer>
            <ChartLayout>
              <PieWrapper>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      dataKey="amount"
                      nameKey="category"
                      label={renderCustomLabel}
                      labelLine={false}
                      strokeWidth={2}
                      stroke="rgba(10,10,10,0.8)"
                    >
                      {data.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </PieWrapper>
              <LegendList>
                {data.map((item, index) => (
                  <LegendItem key={item.category}>
                    <LegendDot $color={COLORS[index % COLORS.length]} />
                    {item.category}{' '}
                    <LegendPercent>({item.percentage}%)</LegendPercent>
                  </LegendItem>
                ))}
              </LegendList>
            </ChartLayout>
          </ChartContainer>
        )}
      </FinanceCardContent>
    </FinanceCard>
  );
}
