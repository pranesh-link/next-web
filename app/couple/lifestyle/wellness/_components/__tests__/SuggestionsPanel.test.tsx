import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SuggestionsPanel from "../SuggestionsPanel";
import type { WellnessSuggestion } from "@/_services/lifestyle/insights";

function makeSuggestion(i: number): WellnessSuggestion {
  return {
    icon: "💡",
    text: `Suggestion ${i}`,
    type: "info",
  };
}

describe("SuggestionsPanel", () => {
  it("should render the empty state when no suggestions are provided", () => {
    render(<SuggestionsPanel suggestions={[]} />);
    expect(screen.getByText(/no suggestions right now/i)).toBeInTheDocument();
  });

  it("should render only the top 3 suggestions when 3 or fewer are provided", () => {
    const suggestions = [makeSuggestion(1), makeSuggestion(2), makeSuggestion(3)];
    render(<SuggestionsPanel suggestions={suggestions} />);
    expect(screen.getByText("Suggestion 1")).toBeInTheDocument();
    expect(screen.getByText("Suggestion 2")).toBeInTheDocument();
    expect(screen.getByText("Suggestion 3")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /view all/i })).not.toBeInTheDocument();
  });

  it("should show a View all button when more than 3 suggestions exist", () => {
    const suggestions = [
      makeSuggestion(1),
      makeSuggestion(2),
      makeSuggestion(3),
      makeSuggestion(4),
      makeSuggestion(5),
    ];
    render(<SuggestionsPanel suggestions={suggestions} />);
    expect(screen.getByRole("button", { name: /view all \(5\)/i })).toBeInTheDocument();
    expect(screen.queryByText("Suggestion 4")).not.toBeInTheDocument();
  });

  it("should open a modal listing all suggestions when View all is clicked", async () => {
    const user = userEvent.setup();
    const suggestions = [
      makeSuggestion(1),
      makeSuggestion(2),
      makeSuggestion(3),
      makeSuggestion(4),
      makeSuggestion(5),
    ];
    render(<SuggestionsPanel suggestions={suggestions} />);
    await user.click(screen.getByRole("button", { name: /view all/i }));
    const dialog = screen.getByRole("dialog", { name: /all suggestions/i });
    expect(within(dialog).getByText("Suggestion 4")).toBeInTheDocument();
    expect(within(dialog).getByText("Suggestion 5")).toBeInTheDocument();
  });
});
