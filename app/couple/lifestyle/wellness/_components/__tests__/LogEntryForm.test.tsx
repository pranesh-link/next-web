import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LogEntryForm, { Props } from "../LogEntryForm";

function renderForm(overrides: Partial<Props> = {}) {
  const props: Props = {
    defaults: { heightInCm: 175, weightInKg: 72 },
    onSubmit: jest.fn().mockResolvedValue(undefined),
    saving: false,
    existingDates: [],
    onDuplicate: jest.fn(),
    ...overrides,
  };
  const result = render(<LogEntryForm {...props} />);
  return { ...result, props };
}

function todayIso() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

describe("LogEntryForm", () => {
  describe("rendering defaults", () => {
    it("should populate weight and height from defaults", () => {
      renderForm();
      expect(screen.getByPlaceholderText("e.g. 72.5")).toHaveValue(72);
      expect(screen.getByPlaceholderText("e.g. 175")).toHaveValue(175);
    });

    it("should leave inputs empty when defaults are 0", () => {
      renderForm({ defaults: { heightInCm: 0, weightInKg: 0 } });
      expect(screen.getByPlaceholderText("e.g. 72.5")).toHaveValue(null);
      expect(screen.getByPlaceholderText("e.g. 175")).toHaveValue(null);
    });
  });

  describe("height locking", () => {
    it("should disable height input when defaults.heightInCm > 0", () => {
      renderForm();
      expect(screen.getByPlaceholderText("e.g. 175")).toBeDisabled();
      expect(
        screen.getByText("Height is set once across entries"),
      ).toBeInTheDocument();
    });

    it("should not disable height when defaults.heightInCm is 0", () => {
      renderForm({ defaults: { heightInCm: 0, weightInKg: 0 } });
      expect(screen.getByPlaceholderText("e.g. 175")).not.toBeDisabled();
    });
  });

  describe("form reset after submit", () => {
    it("should reset weight and note but keep height after submit", async () => {
      const { props } = renderForm();
      const noteInput = screen.getByPlaceholderText("Anything to remember?");

      await userEvent.type(noteInput, "Felt good today");
      await userEvent.click(screen.getByRole("button", { name: "Save" }));

      await waitFor(() => {
        expect(props.onSubmit).toHaveBeenCalledTimes(1);
      });

      expect(screen.getByPlaceholderText("e.g. 72.5")).toHaveValue(null);
      expect(noteInput).toHaveValue("");
      expect(screen.getByPlaceholderText("e.g. 175")).toHaveValue(175);
    });
  });

  describe("duplicate prevention", () => {
    it("should call onDuplicate and not onSubmit when date exists", async () => {
      const { props } = renderForm({ existingDates: [todayIso()] });

      await userEvent.click(screen.getByRole("button", { name: "Save" }));

      expect(props.onDuplicate).toHaveBeenCalledTimes(1);
      expect(props.onSubmit).not.toHaveBeenCalled();
    });
  });

  describe("normal submit", () => {
    it("should call onSubmit with correct values", async () => {
      const { props } = renderForm({
        defaults: { heightInCm: 0, weightInKg: 0 },
      });
      const dateInput = screen.getByDisplayValue(todayIso());
      const weightInput = screen.getByPlaceholderText("e.g. 72.5");
      const heightInput = screen.getByPlaceholderText("e.g. 175");
      const noteInput = screen.getByPlaceholderText("Anything to remember?");

      fireEvent.change(dateInput, { target: { value: "2026-05-01" } });
      await userEvent.type(weightInput, "80");
      await userEvent.type(heightInput, "180");
      await userEvent.type(noteInput, "Morning weigh-in");

      await userEvent.click(screen.getByRole("button", { name: "Save" }));

      await waitFor(() => {
        expect(props.onSubmit).toHaveBeenCalledTimes(1);
      });

      const call = (props.onSubmit as jest.Mock).mock.calls[0][0];
      expect(call.weightInKg).toBe(80);
      expect(call.heightInCm).toBe(180);
      expect(call.note).toBe("Morning weigh-in");
      expect(call.measuredOn).toEqual(new Date("2026-05-01"));
    });

    it("should show error and not submit when weight is invalid", async () => {
      const { props } = renderForm({
        defaults: { heightInCm: 170, weightInKg: 0 },
      });

      await userEvent.type(screen.getByPlaceholderText("e.g. 72.5"), "5");
      await userEvent.click(screen.getByRole("button", { name: "Save" }));

      expect(
        screen.getByText("Weight must be between 20 and 500 kg."),
      ).toBeInTheDocument();
      expect(props.onSubmit).not.toHaveBeenCalled();
    });
  });
});
