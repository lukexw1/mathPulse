/** Tests for XpBar component. */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { XpBar } from "../../components/XpBar";

describe("XpBar", () => {
  it("renders the level in Russian", () => {
    render(<XpBar xp={250} level={3} xpToNextLevel={250} />);
    expect(screen.getByText("Уровень 3")).toBeInTheDocument();
  });

  it("renders XP progress text", () => {
    render(<XpBar xp={250} level={1} xpToNextLevel={250} />);
    // xpInCurrentLevel = 500 - 250 = 250, display: "250 / 500"
    expect(screen.getByText("250 / 500")).toBeInTheDocument();
  });

  it("shows 0 progress when xpToNextLevel equals 500", () => {
    render(<XpBar xp={0} level={1} xpToNextLevel={500} />);
    // xpInCurrentLevel = 500 - 500 = 0
    expect(screen.getByText("0 / 500")).toBeInTheDocument();
  });

  it("shows full progress when xpToNextLevel equals 0", () => {
    render(<XpBar xp={500} level={2} xpToNextLevel={0} />);
    // xpInCurrentLevel = 500 - 0 = 500
    expect(screen.getByText("500 / 500")).toBeInTheDocument();
  });

  it("renders the progress bar fill with correct width", () => {
    const { container } = render(<XpBar xp={350} level={1} xpToNextLevel={150} />);
    // xpInCurrentLevel = 500 - 150 = 350, progress = 70%
    const fill = container.querySelector("div[style]") as HTMLElement;
    expect(fill).toBeInTheDocument();
    expect(fill.style.width).toBe("70%");
  });
});
