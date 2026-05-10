import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MetricsTable from "../MetricsTable";
import type { BodyMetricRow } from "@/_services/lifestyle/body-metric-service";

/** Create a metric with measuredOn set to `daysAgo` days before today. */
function makeMetric(daysAgo: number, weight: number, height = 175): BodyMetricRow {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(12, 0, 0, 0);
  return {
    id: `m-${daysAgo}`,
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

const noop = jest.fn();

describe("MetricsTable", () => {
  it("should render the empty state when there are no metrics", () => {
    render(<MetricsTable metrics={[]} onDelete={noop} onEdit={noop} />);
    expect(screen.getByText(/no entries yet/i)).toBeInTheDocument();
  });

  it("should render one row per metric", () => {
    const metrics = [makeMetric(0, 70), makeMetric(1, 71)];
    render(<MetricsTable metrics={metrics} onDelete={noop} onEdit={noop} />);
    expect(screen.getAllByTestId("metrics-row")).toHaveLength(2);
  });

  it("should show Edit button for today/yesterday entries only", () => {
    const metrics = [makeMetric(0, 70), makeMetric(3, 71)];
    render(<MetricsTable metrics={metrics} onDelete={noop} onEdit={noop} />);
    const editButtons = screen.queryAllByRole("button", { name: /^edit entry/i });
    expect(editButtons).toHaveLength(1); // only today's entry
  });

  it("should show Delete button for entries within 7 days", () => {
    const metrics = [makeMetric(0, 70), makeMetric(10, 71)];
    render(<MetricsTable metrics={metrics} onDelete={noop} onEdit={noop} />);
    const deleteButtons = screen.queryAllByRole("button", { name: /^delete entry/i });
    expect(deleteButtons).toHaveLength(1); // only today's entry
  });

  it("should open the confirmation modal when delete is clicked", async () => {
    const user = userEvent.setup();
    const metrics = [makeMetric(0, 70)];
    render(<MetricsTable metrics={metrics} onDelete={noop} onEdit={noop} />);
    const deleteButtons = screen.getAllByRole("button", { name: /^delete entry/i });
    await user.click(deleteButtons[0]);
    expect(screen.getByRole("dialog", { name: /delete entry/i })).toBeInTheDocument();
  });

  it("should call onDelete with the row id when confirmed", async () => {
    const user = userEvent.setup();
    const onDelete = jest.fn();
    const metrics = [makeMetric(0, 70)];
    render(<MetricsTable metrics={metrics} onDelete={onDelete} onEdit={noop} />);
    const triggers = screen.getAllByRole("button", { name: /^delete entry/i });
    await user.click(triggers[0]);
    const dialog = screen.getByRole("dialog", { name: /delete entry/i });
    const confirm = within(dialog).getByRole("button", { name: "Delete" });
    await user.click(confirm);
    expect(onDelete).toHaveBeenCalledWith("m-0");
  });

  it("should open the edit modal and call onEdit with new weight", async () => {
    const user = userEvent.setup();
    const onEdit = jest.fn();
    const metrics = [makeMetric(0, 70)];
    render(<MetricsTable metrics={metrics} onDelete={noop} onEdit={onEdit} />);
    const editBtn = screen.getByRole("button", { name: /^edit entry/i });
    await user.click(editBtn);
    const dialog = screen.getByRole("dialog", { name: /edit weight/i });
    const input = within(dialog).getByRole("spinbutton");
    await user.clear(input);
    await user.type(input, "72.5");
    const save = within(dialog).getByRole("button", { name: /save/i });
    await user.click(save);
    expect(onEdit).toHaveBeenCalledWith("m-0", 72.5);
  });

  it("should show dash for entries older than 7 days", () => {
    const metrics = [makeMetric(10, 70)];
    render(<MetricsTable metrics={metrics} onDelete={noop} onEdit={noop} />);
    // No action buttons for old entries
    expect(screen.queryByRole("button", { name: /edit entry/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /delete entry/i })).not.toBeInTheDocument();
  });
});
