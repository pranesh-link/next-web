"use client";

import React from "react";
import styled from "styled-components";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, SectionTitle, Subtle } from "@/couple/lifestyle/wellness/_styled";
import { formatDate } from "@/_lib/formatters";
import type { BodyMetricRow } from "@/_services/lifestyle/body-metric-service";

/** Props for {@link WeightTrendChart}. */
export interface Props {
  /** Body-metric history. Sorted internally; only the last 30 are shown. */
  metrics: BodyMetricRow[];
}

const ChartBox = styled.div`
  width: 100%;
  height: 240px;
`;

function buildSeries(metrics: BodyMetricRow[]) {
  return [...metrics]
    .sort((a, b) => new Date(a.measuredOn).getTime() - new Date(b.measuredOn).getTime())
    .slice(-30)
    .map((m) => ({
      date: formatDate(m.measuredOn),
      weight: Number(m.weightInKg),
    }));
}

/**
 * Line chart of weight (kg) over time. Shows the most recent 30 entries.
 * Renders an empty-state message when no metrics exist.
 *
 * @param props - See {@link Props}.
 * @returns A card containing the weight trend chart.
 */
export default function WeightTrendChart({ metrics }: Props) {
  if (metrics.length === 0) {
    return (
      <Card>
        <SectionTitle>Weight trend</SectionTitle>
        <Subtle>Log at least one entry to see your trend.</Subtle>
      </Card>
    );
  }
  const data = buildSeries(metrics);
  return (
    <Card>
      <SectionTitle>Weight trend</SectionTitle>
      <ChartBox data-testid="weight-trend-chart">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} />
            <YAxis
              stroke="var(--text-muted)"
              fontSize={11}
              domain={["auto", "auto"]}
            />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="var(--accent)"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartBox>
    </Card>
  );
}
