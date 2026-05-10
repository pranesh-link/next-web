'use client';

import styled from 'styled-components';
import {
  ResponsiveContainer,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
  ComposedChart,
} from 'recharts';
import { formatCurrency } from '@/_lib/formatters';
import {
  FinanceCard,
  FinanceCardHeader,
  FinanceCardContent,
} from '../theme/styled-primitives';

interface MonthlyTrendData {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}

interface MonthlyTrendChartProps {
  data: MonthlyTrendData[];
}

const ChartContainer = styled.div`
  height: 280px;

  @media screen and (max-width: 480px) {
    height: 220px;
  }
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

const TooltipLabel = styled.p`
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 8px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
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
  text-transform: capitalize;
`;

const TooltipValue = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
`;

const LegendList = styled.ul`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  list-style: none;
  margin: 0;
  padding: 8px 0 0 0;
`;

const LegendItem = styled.li`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-dim);
  text-transform: capitalize;
`;

const LegendDot = styled.span<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${(p) => p.$color};
`;

const SERIES_COLORS: Record<string, string> = {
  income: '#22c55e',
  expenses: '#ef4444',
  savings: '#3b82f6',
};

function formatYAxis(value: number): string {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
  return `₹${value}`;
}

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <TooltipWrapper>
      <TooltipLabel>{label}</TooltipLabel>
      {payload.map((entry) => (
        <TooltipRow key={entry.name}>
          <span>
            <TooltipDot $color={entry.color} />
            <TooltipName>{entry.name}</TooltipName>
          </span>
          <TooltipValue>{formatCurrency(entry.value)}</TooltipValue>
        </TooltipRow>
      ))}
    </TooltipWrapper>
  );
}

interface LegendPayloadItem {
  value: string;
  color: string;
}

function CustomLegend({ payload }: { payload?: LegendPayloadItem[] }) {
  if (!payload?.length) return null;
  return (
    <LegendList>
      {payload.map((entry) => (
        <LegendItem key={entry.value}>
          <LegendDot $color={entry.color} />
          {entry.value}
        </LegendItem>
      ))}
    </LegendList>
  );
}

export default function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  return (
    <FinanceCard>
      <FinanceCardHeader>Monthly Trends</FinanceCardHeader>
      <FinanceCardContent>
        {data.length === 0 ? (
          <EmptyState>No trend data available</EmptyState>
        ) : (
          <ChartContainer>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={data}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: '#71717a' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={formatYAxis}
                  tick={{ fontSize: 12, fill: '#71717a' }}
                  axisLine={false}
                  tickLine={false}
                  width={60}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Legend content={<CustomLegend />} />
                <Bar
                  dataKey="income"
                  fill={SERIES_COLORS.income}
                  radius={[4, 4, 0, 0]}
                  barSize={18}
                />
                <Bar
                  dataKey="expenses"
                  fill={SERIES_COLORS.expenses}
                  radius={[4, 4, 0, 0]}
                  barSize={18}
                />
                <Line
                  type="monotone"
                  dataKey="savings"
                  stroke={SERIES_COLORS.savings}
                  strokeWidth={2}
                  dot={{ r: 3, fill: SERIES_COLORS.savings }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </FinanceCardContent>
    </FinanceCard>
  );
}
