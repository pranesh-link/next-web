import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BMIRangeLegend from "../BMIRangeLegend";
import { BMI_BANDS, BAND_INSIGHTS } from "../../_constants";

jest.mock("@/couple/_components/shared/Modal", () => {
  const MockModal = ({ isOpen, onClose, title, children }: {
    isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode;
  }) =>
    isOpen ? (
      <dialog role="dialog" open>
        <h2>{title}</h2>
        {children}
        <button onClick={onClose}>Close</button>
      </dialog>
    ) : null;
  MockModal.displayName = "MockModal";
  return MockModal;
});

describe("BMIRangeLegend", () => {
  const setup = (currentKey: string | null = null) => {
    const user = userEvent.setup();
    render(<BMIRangeLegend bands={BMI_BANDS} currentKey={currentKey} />);
    return { user };
  };

  it("should render all 4 BMI band pills", () => {
    setup();

    for (const band of BMI_BANDS) {
      expect(
        screen.getByText(`${band.label} (${band.min}–${band.max})`),
      ).toBeInTheDocument();
    }
  });

  it("should open a modal when a pill is clicked", async () => {
    const { user } = setup();

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByText(/Healthy/));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(BAND_INSIGHTS.healthy.title)).toBeInTheDocument();
  });

  it("should show the recommendation text for the selected band", async () => {
    const { user } = setup();

    await user.click(screen.getByText(/Overweight/));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent(BAND_INSIGHTS.overweight.description);
    expect(dialog).toHaveTextContent(BAND_INSIGHTS.overweight.recommendation);
  });

  it("should close the modal when the close button is clicked", async () => {
    const { user } = setup();

    await user.click(screen.getByText(/Obese/));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByText("Close"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should switch insights when a different pill is clicked after closing", async () => {
    const { user } = setup();

    await user.click(screen.getByText(/Underweight/));
    expect(screen.getByRole("dialog")).toHaveTextContent(
      BAND_INSIGHTS.underweight.recommendation,
    );

    await user.click(screen.getByText("Close"));
    await user.click(screen.getByText(/Obese/));
    expect(screen.getByRole("dialog")).toHaveTextContent(
      BAND_INSIGHTS.obese.recommendation,
    );
  });
});
