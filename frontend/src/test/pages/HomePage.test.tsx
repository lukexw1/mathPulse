/** Tests for HomePage component. */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { HomePage } from "../../pages/HomePage";
import { useDashboardStore } from "../../stores/dashboardStore";
import { mockDashboardData } from "../fixtures";

// Track navigations
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("../../api/client", () => ({
  fetchDashboard: vi.fn(),
}));

import { fetchDashboard } from "../../functions/client";
const mockedFetchDashboard = vi.mocked(fetchDashboard);

function renderHomePage() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );
}

describe("HomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset Zustand store between tests so cached data doesn't leak
    useDashboardStore.setState({
      dashboard: null,
      isLoading: false,
      error: false,
      lastFetchedAt: 0,
    });
  });

  it("shows loading skeletons initially", () => {
    mockedFetchDashboard.mockReturnValue(new Promise(() => {})); // never resolves
    const { container } = renderHomePage();
    const skeletons = container.querySelectorAll(".skeleton");
    expect(skeletons.length).toBeGreaterThanOrEqual(3);
  });

  it("shows error state when dashboard fails to load", async () => {
    mockedFetchDashboard.mockResolvedValue({
      data: null as unknown as import("../../types").DashboardData,
      error: "Server error",
      message: null,
    });

    renderHomePage();

    await waitFor(() => {
      expect(screen.getByText("Не удалось загрузить данные")).toBeInTheDocument();
    });
  });

  it("renders dashboard data after loading", async () => {
    mockedFetchDashboard.mockResolvedValue({
      data: mockDashboardData,
      error: null,
      message: null,
    });

    renderHomePage();

    await waitFor(() => {
      expect(screen.getByText("Начать практику")).toBeInTheDocument();
    });

    // Streak count
    expect(screen.getByText("3")).toBeInTheDocument();

    // Streak label
    expect(screen.getByText("Ежедневная серия")).toBeInTheDocument();

    // Streak record
    expect(screen.getByText(/Рекорд: 7/)).toBeInTheDocument();

    // Start Practice button
    expect(screen.getByText("Запустить")).toBeInTheDocument();

    // Total solved
    expect(screen.getByText(/Всего решено: 40/)).toBeInTheDocument();
  });

  it("shows next unlearned topic when available", async () => {
    mockedFetchDashboard.mockResolvedValue({
      data: mockDashboardData, // has next_unlearned_topic
      error: null,
      message: null,
    });

    renderHomePage();

    await waitFor(() => {
      expect(screen.getByText("Выучить новую тему")).toBeInTheDocument();
    });

    expect(screen.getByText("Линейные уравнения")).toBeInTheDocument();
    expect(screen.getByText("8 мин чтения")).toBeInTheDocument();
  });

  it("shows 'all topics learned' when no unlearned topics", async () => {
    mockedFetchDashboard.mockResolvedValue({
      data: { ...mockDashboardData, next_unlearned_topic: null },
      error: null,
      message: null,
    });

    renderHomePage();

    await waitFor(() => {
      expect(screen.getByText("Начать практику")).toBeInTheDocument();
    });

    expect(screen.getByText("Все темы изучены!")).toBeInTheDocument();
  });

  it("navigates to /practice when Запустить is clicked", async () => {
    mockedFetchDashboard.mockResolvedValue({
      data: mockDashboardData,
      error: null,
      message: null,
    });

    renderHomePage();

    await waitFor(() => {
      expect(screen.getByText("Запустить")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByText("Запустить"));

    expect(mockNavigate).toHaveBeenCalledWith("/practice");
  });

  it("navigates to /theory/:subtopic when theory topic is clicked", async () => {
    mockedFetchDashboard.mockResolvedValue({
      data: mockDashboardData,
      error: null,
      message: null,
    });

    renderHomePage();

    await waitFor(() => {
      expect(screen.getByText("Линейные уравнения")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    // Click the theory button containing the topic info
    await user.click(screen.getByText("Линейные уравнения").closest("button")!);

    expect(mockNavigate).toHaveBeenCalledWith("/theory/linear_equations");
  });

  it("renders topic progress list", async () => {
    mockedFetchDashboard.mockResolvedValue({
      data: mockDashboardData,
      error: null,
      message: null,
    });

    renderHomePage();

    await waitFor(() => {
      expect(screen.getByText("Алгебра")).toBeInTheDocument();
    });

    expect(screen.getByText("Геометрия")).toBeInTheDocument();
    expect(screen.getByText("Анализ данных")).toBeInTheDocument();
    expect(screen.getByText("Высшая математика")).toBeInTheDocument();
  });
});
