import React from "react";
import { render, screen } from "@testing-library/react";
import WeightTrendChart from "../WeightTrendChart";
import type { BodyMetricRow } from "@/_services/lifestyle/body-metric-service";

// jsdom has no layout, so Recharts ResponsiveContainer renders nothing.
// Mock it to render children with explicit dimensions for the test.
jest.mock("recharts", () => {
  const actual = jest.requireActual("recharts");
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
  };
});

function makeMetric(idx: number, weight: number): BodyMetricRow {
  const date = new Date(2025, 0, idx + 1);
  return {
    id: `m-${idx}`,
    userId: "u1",
    subjectId: "u1",
    coupleId: null,
    measuredOn: date,
    weightInKg: weight as unknown as BodyMetricRow["weightInKg"],
    heightInCm: 175 as unknown as BodyMetricRow["heightInCm"],
    bmi: 22 as unknown as BodyMetricRow["bmi"],
    bmiCategory: "healthy",
    note: null,
    createdAt: date,
    updatedAt: date,
  } as BodyMetricRow;
}

describe("WeightTrendChart", () => {
  it("should render the empty-state message when no metrics are provided", () => {
    render(<WeightTrendChart metrics={[]} />);
    expect(screen.getByText(/log at least one entry/i)).toBeInTheDocument();
  });

  it("should render the chart container when metrics are present", () => {
    const metrics = [makeMetric(0, 70), makeMetric(1, 71), makeMetric(2, 72)];
    render(<WeightTrendChart metrics={metrics} />);
    expect(screen.getByTestId("weight-trend-chart")).toBeInTheDocument();
    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
  });
});
