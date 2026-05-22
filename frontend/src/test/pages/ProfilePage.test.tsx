/** Tests for ProfilePage component. */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ProfilePage } from "../../pages/ProfilePage";
import { useProfileStore } from "../../stores/profileStore";

vi.mock("../../api/client", () => ({
  fetchProfile: vi.fn(),
}));

import { fetchProfile } from "../../functions/client";
const mockedFetchProfile = vi.mocked(fetchProfile);

const mockProfileData = {
  id: 123456,
  first_name: "Test",
  username: "testuser",
  xp: 250,
  level: 3,
  streak_days: 5,
  total_solved: 40,
  accuracy: 0.78,
  achievements: [
    { code: "first_correct", title: "First Steps", description: "Answer first question correctly" },
    { code: "streak_3", title: "On Fire!", description: "3-day streak" },
  ],
  topics: {
    algebra: { solved: 15, total_questions: 20, accuracy: 0.75 },
    geometry: { solved: 8, total_questions: 10, accuracy: 0.8 },
  },
};

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset Zustand store between tests so cached data doesn't leak
    useProfileStore.setState({
      profile: null,
      isLoading: false,
      lastFetchedAt: 0,
    });
  });

  it("shows loading skeletons initially", () => {
    mockedFetchProfile.mockReturnValue(new Promise(() => {}));
    const { container } = render(<ProfilePage />);
    const skeletons = container.querySelectorAll(".skeleton");
    expect(skeletons.length).toBeGreaterThanOrEqual(2);
  });

  it("shows error state when profile fails to load", async () => {
    mockedFetchProfile.mockResolvedValue({
      data: null,
      error: "Server error",
      message: null,
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText("Не удалось загрузить профиль")).toBeInTheDocument();
    });
  });

  it("renders user name and avatar initial", async () => {
    mockedFetchProfile.mockResolvedValue({
      data: mockProfileData,
      error: null,
      message: null,
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText("Test")).toBeInTheDocument();
    });

    // Avatar shows first letter
    expect(screen.getByText("T")).toBeInTheDocument();
    // Username
    expect(screen.getByText("@testuser")).toBeInTheDocument();
  });

  it("renders stats grid (solved, accuracy, XP)", async () => {
    mockedFetchProfile.mockResolvedValue({
      data: mockProfileData,
      error: null,
      message: null,
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText("250")).toBeInTheDocument(); // XP value
    });

    expect(screen.getByText("78%")).toBeInTheDocument(); // accuracy
    expect(screen.getByText("XP")).toBeInTheDocument(); // XP label
    expect(screen.getByText("40 задач")).toBeInTheDocument(); // total_solved
    expect(screen.getByText("Точность")).toBeInTheDocument();
    expect(screen.getByText("Прогресс обучения")).toBeInTheDocument();
  });

  it("renders achievements", async () => {
    mockedFetchProfile.mockResolvedValue({
      data: mockProfileData,
      error: null,
      message: null,
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText("First Steps")).toBeInTheDocument();
    });

    expect(screen.getByText("Answer first question correctly")).toBeInTheDocument();
    expect(screen.getByText("On Fire!")).toBeInTheDocument();
    expect(screen.getByText("3-day streak")).toBeInTheDocument();
  });

  it("shows empty achievements message when no achievements", async () => {
    mockedFetchProfile.mockResolvedValue({
      data: { ...mockProfileData, achievements: [] },
      error: null,
      message: null,
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText("Пока нет достижений. Продолжай практиковаться!")).toBeInTheDocument();
    });
  });

  it("renders per-topic progress with accuracy", async () => {
    mockedFetchProfile.mockResolvedValue({
      data: mockProfileData,
      error: null,
      message: null,
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText("Алгебра")).toBeInTheDocument();
    });

    expect(screen.getByText("15/20 (75%)")).toBeInTheDocument();
    expect(screen.getByText("Геометрия")).toBeInTheDocument();
    expect(screen.getByText("8/10 (80%)")).toBeInTheDocument();
  });

  it("hides username if not set", async () => {
    mockedFetchProfile.mockResolvedValue({
      data: { ...mockProfileData, username: null },
      error: null,
      message: null,
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText("Test")).toBeInTheDocument();
    });

    expect(screen.queryByText(/@/)).not.toBeInTheDocument();
  });
});
