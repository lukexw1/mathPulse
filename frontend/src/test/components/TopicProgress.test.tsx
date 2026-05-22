/** Tests for TopicProgressList component. */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TopicProgressList } from "../../components/TopicProgress";
import { mockTopicProgress } from "../fixtures";

describe("TopicProgressList", () => {
  it("renders all topic names in Russian", () => {
    render(<TopicProgressList topics={mockTopicProgress} />);
    expect(screen.getByText("Алгебра")).toBeInTheDocument();
    expect(screen.getByText("Геометрия")).toBeInTheDocument();
    expect(screen.getByText("Анализ данных")).toBeInTheDocument();
    expect(screen.getByText("Высшая математика")).toBeInTheDocument();
  });

  it("renders accuracy percentages in aria-labels", () => {
    render(<TopicProgressList topics={mockTopicProgress} />);
    expect(screen.getByLabelText("Алгебра: 20%")).toBeInTheDocument();
    expect(screen.getByLabelText("Геометрия: 13%")).toBeInTheDocument();
    expect(screen.getByLabelText("Анализ данных: 6%")).toBeInTheDocument();
    expect(screen.getByLabelText("Высшая математика: 3%")).toBeInTheDocument();
  });

  it("renders the section heading in Russian", () => {
    render(<TopicProgressList topics={mockTopicProgress} />);
    expect(screen.getByText("Прогресс по темам")).toBeInTheDocument();
  });

  it("renders progress bars for each topic", () => {
    const { container } = render(<TopicProgressList topics={mockTopicProgress} />);
    // Progress bars use inline style width on inner divs
    const bars = container.querySelectorAll("[style]");
    expect(bars.length).toBeGreaterThanOrEqual(4);
  });

  it("renders correct progress bar widths", () => {
    const { container } = render(<TopicProgressList topics={mockTopicProgress} />);
    // Each topic has a fill div with inline style width
    const fills = container.querySelectorAll("div[style]") as NodeListOf<HTMLElement>;
    const widths = Array.from(fills)
      .map((el) => el.style.width)
      .filter((w) => w);
    expect(widths).toContain("20%");
    expect(widths).toContain("13%");
    expect(widths).toContain("6%");
    expect(widths).toContain("3%");
  });

  it("renders empty list when no topics", () => {
    const { container } = render(<TopicProgressList topics={[]} />);
    // No fill bars when no topics
    const fills = container.querySelectorAll("div[style]") as NodeListOf<HTMLElement>;
    const widths = Array.from(fills)
      .map((el) => el.style.width)
      .filter((w) => w);
    expect(widths).toHaveLength(0);
  });
});
