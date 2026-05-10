"use client";

import React from "react";
import styled from "styled-components";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, SectionTitle, Subtle } from "@/couple/lifestyle/wellness/_styled";
import { formatDate } from "@/_lib/formatters";
import { BMI_BANDS } from "@/couple/lifestyle/wellness/_constants";
import { getBMI } from "@/_services/lifestyle/bmi";
import type { BodyMetricRow } from "@/_services/lifestyle/body-metric-service";

/** Props for {@link BMITrendChart}. */
export interface Props {
  /** Body-metric history (last 30 are shown). */
  metrics: BodyMetricRow[];
  /** BMI bands to render as background reference areas. */
  bands: typeof BMI_BANDS;
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
      bmi: Number(
        getBMI({ heightInCm: Number(m.heightInCm), weightInKg: Number(m.weightInKg) }).toFixed(2),
      ),
    }));
}

/**
 * Area chart of BMI over time with WHO band ranges drawn as
 * reference areas in the background.
 *
 * @param props - See {@link Props}.
 * @returns A card containing the BMI trend chart.
 */
export default function BMITrendChart({ metrics, bands }: Props) {
  if (metrics.length === 0) {
    return (
      <Card>
        <SectionTitle>BMI trend</SectionTitle>
        <Subtle>Log at least one entry to see your trend.</Subtle>
      </Card>
    );
  }
  const data = buildSeries(metrics);
  return (
    <Card>
      <SectionTitle>BMI trend</SectionTitle>
      <ChartBox data-testid="bmi-trend-chart">
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} />
            <YAxis stroke="var(--text-muted)" fontSize={11} domain={[10, 40]} />
            <Tooltip />
            {bands.map((b) => (
              <ReferenceArea
                key={b.key}
                y1={b.min}
                y2={b.max}
                fill={b.color}
                fillOpacity={0.12}
                strokeOpacity={0}
              />
            ))}
            <Area
              type="monotone"
              dataKey="bmi"
              stroke="var(--accent)"
              fill="transparent"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartBox>
    </Card>
  );
}
