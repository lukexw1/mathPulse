/** Tests for QuestionCard component. */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuestionCard } from "../../components/QuestionCard";
import { mockQuestion, mockGridInQuestion } from "../fixtures";

describe("QuestionCard", () => {
  describe("multiple choice", () => {
    it("renders all answer choices", () => {
      render(
        <QuestionCard
          question={mockQuestion}
          selectedAnswer={null}
          onSelect={vi.fn()}
          disabled={false}
        />,
      );
      // New design renders labels as plain "A", "B", etc. (no parenthesis)
      expect(screen.getByText("A")).toBeInTheDocument();
      expect(screen.getByText("B")).toBeInTheDocument();
      expect(screen.getByText("C")).toBeInTheDocument();
      expect(screen.getByText("D")).toBeInTheDocument();
    });

    it("calls onSelect when a choice is clicked", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(
        <QuestionCard
          question={mockQuestion}
          selectedAnswer={null}
          onSelect={onSelect}
          disabled={false}
        />,
      );

      await user.click(screen.getByText("A"));
      expect(onSelect).toHaveBeenCalledWith("A");
    });

    it("does not call onSelect when disabled", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(
        <QuestionCard
          question={mockQuestion}
          selectedAnswer={null}
          onSelect={onSelect}
          disabled={true}
        />,
      );

      await user.click(screen.getByText("A"));
      expect(onSelect).not.toHaveBeenCalled();
    });

    it("highlights the selected answer with appropriate classes", () => {
      const { container } = render(
        <QuestionCard
          question={mockQuestion}
          selectedAnswer="B"
          onSelect={vi.fn()}
          disabled={false}
        />,
      );

      const buttons = container.querySelectorAll("button");
      // Second button (B) should have selected styling (neon-glow-primary class)
      const buttonB = buttons[1];
      expect(buttonB.className).toContain("neon-glow-primary");
      // First button (A) should not have selected styling
      const buttonA = buttons[0];
      expect(buttonA.className).not.toContain("neon-glow-primary");
    });
  });

  describe("grid_in", () => {
    it("renders a text input for grid_in questions", () => {
      render(
        <QuestionCard
          question={mockGridInQuestion}
          selectedAnswer={null}
          onSelect={vi.fn()}
          disabled={false}
        />,
      );

      const input = screen.getByPlaceholderText("Введите ваш ответ...");
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("inputMode", "decimal");
    });

    it("does not render choice buttons for grid_in", () => {
      const { container } = render(
        <QuestionCard
          question={mockGridInQuestion}
          selectedAnswer={null}
          onSelect={vi.fn()}
          disabled={false}
        />,
      );

      const buttons = container.querySelectorAll("button");
      expect(buttons).toHaveLength(0);
    });

    it("calls onSelect on input change", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(
        <QuestionCard
          question={mockGridInQuestion}
          selectedAnswer=""
          onSelect={onSelect}
          disabled={false}
        />,
      );

      const input = screen.getByPlaceholderText("Введите ваш ответ...");
      await user.type(input, "3");
      expect(onSelect).toHaveBeenCalledWith("3");
    });

    it("disables input when disabled", () => {
      render(
        <QuestionCard
          question={mockGridInQuestion}
          selectedAnswer=""
          onSelect={vi.fn()}
          disabled={true}
        />,
      );

      const input = screen.getByPlaceholderText("Введите ваш ответ...");
      expect(input).toBeDisabled();
    });
  });
});
