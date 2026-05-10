import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CurrentBMICard from "../CurrentBMICard";
import type { WellnessSuggestion } from "@/_services/lifestyle/insights";
import type { CurrentBMIBand } from "../CurrentBMICard";

jest.mock("@/couple/_components/shared/Modal", () => {
  return function MockModal({
    isOpen,
    onClose,
    title,
    children,
  }: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
  }) {
    if (!isOpen) return null;
    return (
      <div data-testid="modal">
        <h2>{title}</h2>
        <button onClick={onClose}>close</button>
        {children}
      </div>
    );
  };
});

const band: CurrentBMIBand = { key: "overweight", label: "Overweight", color: "#e67e22" };

const suggestions: WellnessSuggestion[] = [
  { icon: "⚠️", text: "Consider reducing calorie intake", type: "warning" },
  { icon: "💡", text: "Try 30 minutes of walking daily", type: "info" },
];

describe("CurrentBMICard", () => {
  it("should render the BMI value and band label", () => {
    render(<CurrentBMICard bmi={27.3} band={band} deltaWeek={0} />);
    expect(screen.getByText("27.3")).toBeInTheDocument();
    expect(screen.getByText("Overweight")).toBeInTheDocument();
  });

  it("should show the weekly delta when deltaWeek is provided", () => {
    render(<CurrentBMICard bmi={27.3} band={band} deltaWeek={1.2} />);
    expect(screen.getByText(/\+1\.2 kg/)).toBeInTheDocument();
  });

  it("should show negative delta without plus sign", () => {
    render(<CurrentBMICard bmi={27.3} band={band} deltaWeek={-0.8} />);
    expect(screen.getByText(/-0\.8 kg/)).toBeInTheDocument();
  });

  it("should render the smart suggestions button when suggestions are passed", () => {
    render(<CurrentBMICard bmi={27.3} band={band} deltaWeek={0} suggestions={suggestions} />);
    expect(screen.getByText("💡 Smart suggestions")).toBeInTheDocument();
  });

  it("should open a modal with suggestion texts when button is clicked", () => {
    render(<CurrentBMICard bmi={27.3} band={band} deltaWeek={0} suggestions={suggestions} />);
    expect(screen.queryByTestId("modal")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("💡 Smart suggestions"));

    expect(screen.getByTestId("modal")).toBeInTheDocument();
    expect(screen.getByText("Smart suggestions")).toBeInTheDocument();
    expect(screen.getByText("Consider reducing calorie intake")).toBeInTheDocument();
    expect(screen.getByText("Try 30 minutes of walking daily")).toBeInTheDocument();
  });

  it("should not render the suggestions button when suggestions is empty", () => {
    render(<CurrentBMICard bmi={27.3} band={band} deltaWeek={0} suggestions={[]} />);
    expect(screen.queryByText("💡 Smart suggestions")).not.toBeInTheDocument();
  });

  it("should not render the suggestions button when suggestions is not passed", () => {
    render(<CurrentBMICard bmi={27.3} band={band} deltaWeek={0} />);
    expect(screen.queryByText("💡 Smart suggestions")).not.toBeInTheDocument();
  });

  it("should render placeholder state when bmi is 0", () => {
    render(<CurrentBMICard bmi={0} band={null} deltaWeek={0} />);
    expect(screen.getByText("Log to see your BMI")).toBeInTheDocument();
    expect(screen.getByText("Add your first entry to begin tracking.")).toBeInTheDocument();
  });
});
