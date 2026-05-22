/** Tests for TabBar component. */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TabBar } from "../../components/TabBar";

function renderWithRouter(initialRoute = "/") {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <TabBar />
    </MemoryRouter>,
  );
}

describe("TabBar", () => {
  it("renders all five tabs", () => {
    renderWithRouter();
    expect(screen.getByText("Дашборд")).toBeInTheDocument();
    expect(screen.getByText("Практика")).toBeInTheDocument();
    expect(screen.getByText("Калькулятор")).toBeInTheDocument();
    expect(screen.getByText("Теория")).toBeInTheDocument();
    expect(screen.getByText("Профиль")).toBeInTheDocument();
  });

  it("has correct link destinations", () => {
    renderWithRouter();
    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "/");
    expect(links[1]).toHaveAttribute("href", "/practice");
    expect(links[2]).toHaveAttribute("href", "/calculator");
    expect(links[3]).toHaveAttribute("href", "/theory");
    expect(links[4]).toHaveAttribute("href", "/profile");
  });

  it("marks Home tab as active on / route", () => {
    renderWithRouter("/");
    const homeLink = screen.getByText("Дашборд").closest("a");
    expect(homeLink?.className).toContain("text-primary");
  });

  it("marks Practice tab as active on /practice route", () => {
    renderWithRouter("/practice");
    const practiceLink = screen.getByText("Практика").closest("a");
    expect(practiceLink?.className).toContain("text-primary");
  });

  it("marks Profile tab as active on /profile route", () => {
    renderWithRouter("/profile");
    const profileLink = screen.getByText("Профиль").closest("a");
    expect(profileLink?.className).toContain("text-primary");
  });

  it("does not mark Home as active on /practice route", () => {
    renderWithRouter("/practice");
    const homeLink = screen.getByText("Дашборд").closest("a");
    expect(homeLink?.className).toContain("text-on-surface-variant");
  });
});
