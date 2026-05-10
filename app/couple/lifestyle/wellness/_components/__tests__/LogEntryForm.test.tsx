import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LogEntryForm from "../LogEntryForm";

describe("LogEntryForm", () => {
  it("should render inputs prefilled with defaults", () => {
    render(
      <LogEntryForm
        defaults={{ heightInCm: 175, weightInKg: 72.5 }}
        onSubmit={jest.fn()}
        saving={false}
      />,
    );
    expect(screen.getByDisplayValue("175")).toBeInTheDocument();
    expect(screen.getByDisplayValue("72.5")).toBeInTheDocument();
  });

  it("should fire onSubmit with parsed values when valid", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    render(
      <LogEntryForm
        defaults={{ heightInCm: 175, weightInKg: 72.5 }}
        onSubmit={onSubmit}
        saving={false}
      />,
    );
    await user.click(screen.getByRole("button", { name: /save/i }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    const arg = onSubmit.mock.calls[0][0];
    expect(arg.weightInKg).toBe(72.5);
    expect(arg.heightInCm).toBe(175);
    expect(arg.measuredOn).toBeInstanceOf(Date);
  });

  it("should show inline error and not submit when weight is invalid", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(
      <LogEntryForm
        defaults={{ heightInCm: 175, weightInKg: 0 }}
        onSubmit={onSubmit}
        saving={false}
      />,
    );
    const weight = screen.getByPlaceholderText(/e.g. 72.5/i);
    await user.clear(weight);
    await user.type(weight, "5");
    await user.click(screen.getByRole("button", { name: /save/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/weight/i);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
