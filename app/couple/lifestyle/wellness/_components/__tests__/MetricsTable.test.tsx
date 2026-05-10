import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MetricsTable from "../MetricsTable";
import type { BodyMetricRow } from "@/_services/lifestyle/body-metric-service";

function makeMetric(idx: number, weight: number, height = 175): BodyMetricRow {
  const date = new Date(2025, 0, idx + 1);
  return {
    id: `m-${idx}`,
    userId: "u1",
    subjectId: "u1",
    coupleId: null,
    measuredOn: date,
    weightInKg: weight as unknown as BodyMetricRow["weightInKg"],
    heightInCm: height as unknown as BodyMetricRow["heightInCm"],
    bmi: 22 as unknown as BodyMetricRow["bmi"],
    bmiCategory: "healthy",
    note: null,
    createdAt: date,
    updatedAt: date,
  } as BodyMetricRow;
}

describe("MetricsTable", () => {
  it("should render the empty state when there are no metrics", () => {
    render(<MetricsTable metrics={[]} onDelete={jest.fn()} />);
    expect(screen.getByText(/no entries yet/i)).toBeInTheDocument();
  });

  it("should render one row per metric", () => {
    const metrics = [makeMetric(0, 70), makeMetric(1, 71)];
    render(<MetricsTable metrics={metrics} onDelete={jest.fn()} />);
    expect(screen.getAllByTestId("metrics-row")).toHaveLength(2);
  });

  it("should open the confirmation modal when delete is clicked", async () => {
    const user = userEvent.setup();
    const metrics = [makeMetric(0, 70)];
    render(<MetricsTable metrics={metrics} onDelete={jest.fn()} />);
    const deleteButtons = screen.getAllByRole("button", { name: /delete entry/i });
    await user.click(deleteButtons[0]);
    expect(screen.getByRole("dialog", { name: /delete entry/i })).toBeInTheDocument();
  });

  it("should call onDelete with the row id when the modal Delete is confirmed", async () => {
    const user = userEvent.setup();
    const onDelete = jest.fn();
    const metrics = [makeMetric(7, 70)];
    render(<MetricsTable metrics={metrics} onDelete={onDelete} />);
    const triggers = screen.getAllByRole("button", { name: /delete entry/i });
    await user.click(triggers[0]);
    const dialog = screen.getByRole("dialog", { name: /delete entry/i });
    const confirm = within(dialog).getByRole("button", { name: "Delete" });
    await user.click(confirm);
    expect(onDelete).toHaveBeenCalledWith("m-7");
  });
});
