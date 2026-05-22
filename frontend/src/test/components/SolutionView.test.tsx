/** Tests for SolutionView component. */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SolutionView } from "../../components/SolutionView";
import { mockCorrectResult, mockIncorrectResult, mockResultWithAchievement } from "../fixtures";

describe("SolutionView", () => {
  it("shows 'Правильно' for correct answers", () => {
    render(<SolutionView result={mockCorrectResult} onNext={vi.fn()} />);
    expect(screen.getByText("Правильно")).toBeInTheDocument();
  });

  it("shows 'Неправильно' for wrong answers", () => {
    render(<SolutionView result={mockIncorrectResult} onNext={vi.fn()} />);
    expect(screen.getByText("Неправильно")).toBeInTheDocument();
  });

  it("shows the correct answer when incorrect", () => {
    render(<SolutionView result={mockIncorrectResult} onNext={vi.fn()} />);
    expect(screen.getByText("B")).toBeInTheDocument();
  });

  it("shows XP earned for correct answers", () => {
    render(<SolutionView result={mockCorrectResult} onNext={vi.fn()} />);
    expect(screen.getByText("+10 XP")).toBeInTheDocument();
  });

  it("does not show XP when 0 earned", () => {
    render(<SolutionView result={mockIncorrectResult} onNext={vi.fn()} />);
    expect(screen.queryByText("+0 XP")).not.toBeInTheDocument();
  });

  it("renders all solution steps", () => {
    render(<SolutionView result={mockCorrectResult} onNext={vi.fn()} />);
    // New design renders step numbers as zero-padded: "01", "02", "03"
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("02")).toBeInTheDocument();
    expect(screen.getByText("03")).toBeInTheDocument();
    // Step text is rendered via MathText (each part in a <span>)
    expect(screen.getByText("Subtract 5 from both sides")).toBeInTheDocument();
    expect(screen.getByText("Simplify")).toBeInTheDocument();
    expect(screen.getByText("Divide both sides by 2")).toBeInTheDocument();
  });

  it("renders formulas in solution steps", () => {
    const { container } = render(<SolutionView result={mockCorrectResult} onNext={vi.fn()} />);
    // FormulaBlock renders raw LaTeX via KaTeX — check that .katex elements are present
    const katexElements = container.querySelectorAll(".katex");
    expect(katexElements.length).toBeGreaterThanOrEqual(3);
  });

  it("shows achievement toast when earned", () => {
    render(<SolutionView result={mockResultWithAchievement} onNext={vi.fn()} />);
    expect(screen.getByText(/first_correct/)).toBeInTheDocument();
  });

  it("does not show achievement toast when none earned", () => {
    render(<SolutionView result={mockCorrectResult} onNext={vi.fn()} />);
    expect(screen.queryByText(/Достижение/)).not.toBeInTheDocument();
  });

  it("calls onNext when 'Следующий вопрос' button is clicked", async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();
    render(<SolutionView result={mockCorrectResult} onNext={onNext} />);

    await user.click(screen.getByText("Следующий вопрос"));
    expect(onNext).toHaveBeenCalledOnce();
  });
});
