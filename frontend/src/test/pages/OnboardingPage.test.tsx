/** Tests for OnboardingPage component. */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { OnboardingPage } from "../../pages/OnboardingPage";
import { mockOnboardingQuestions } from "../fixtures";

vi.mock("../../api/client", () => ({
  setGoal: vi.fn(),
  fetchOnboardingTest: vi.fn(),
  submitOnboardingResult: vi.fn(),
}));

vi.mock("../../stores/authStore", () => ({
  useAuthStore: vi.fn(() => ({
    authenticate: vi.fn(),
  })),
}));

import { setGoal, fetchOnboardingTest, submitOnboardingResult } from "../../functions/client";
const mockedSetGoal = vi.mocked(setGoal);
const mockedFetchOnboardingTest = vi.mocked(fetchOnboardingTest);
const mockedSubmitOnboardingResult = vi.mocked(submitOnboardingResult);

describe("OnboardingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders goal selection step initially", () => {
    render(<OnboardingPage />);

    expect(screen.getByText("mathpulse")).toBeInTheDocument();
    expect(screen.getByText("Выбери свою цель")).toBeInTheDocument();
    expect(screen.getByText("SAT Math")).toBeInTheDocument();
    expect(screen.getByText("Общая практика")).toBeInTheDocument();
  });

  it("calls setGoal and loads test questions when a goal is selected", async () => {
    mockedSetGoal.mockResolvedValue({ data: null, error: null, message: null });
    mockedFetchOnboardingTest.mockResolvedValue({
      data: mockOnboardingQuestions,
      error: null,
      message: null,
    });

    render(<OnboardingPage />);

    const user = userEvent.setup();
    await user.click(screen.getByText("SAT Math"));

    expect(mockedSetGoal).toHaveBeenCalledWith("sat");

    await waitFor(() => {
      expect(screen.getByText("Оценка уровня")).toBeInTheDocument();
    });
  });

  it("shows progress bar during the test", async () => {
    mockedSetGoal.mockResolvedValue({ data: null, error: null, message: null });
    mockedFetchOnboardingTest.mockResolvedValue({
      data: mockOnboardingQuestions,
      error: null,
      message: null,
    });

    const { container } = render(<OnboardingPage />);

    const user = userEvent.setup();
    await user.click(screen.getByText("SAT Math"));

    await waitFor(() => {
      expect(screen.getByText("Оценка уровня")).toBeInTheDocument();
    });

    // Progress bar uses inline style width on a div with gradient classes
    const fills = container.querySelectorAll("div[style]") as NodeListOf<HTMLElement>;
    const hasProgressBar = Array.from(fills).some((el) => el.style.width);
    expect(hasProgressBar).toBe(true);
  });

  it("shows Далее button before last question and Завершить on last", async () => {
    mockedSetGoal.mockResolvedValue({ data: null, error: null, message: null });
    mockedFetchOnboardingTest.mockResolvedValue({
      data: mockOnboardingQuestions.slice(0, 2), // Only 2 questions
      error: null,
      message: null,
    });

    render(<OnboardingPage />);

    const user = userEvent.setup();
    await user.click(screen.getByText("SAT Math"));

    await waitFor(() => {
      expect(screen.getByText("Далее")).toBeInTheDocument();
    });

    // Select an answer (choice label is "A" in the new design)
    await user.click(screen.getByText("A").closest("button")!);
    await user.click(screen.getByText("Далее"));

    // Second (last) question should show Завершить
    await waitFor(() => {
      expect(screen.getByText("Завершить")).toBeInTheDocument();
    });
  });

  it("shows results after completing the assessment", async () => {
    mockedSetGoal.mockResolvedValue({ data: null, error: null, message: null });
    mockedFetchOnboardingTest.mockResolvedValue({
      data: mockOnboardingQuestions.slice(0, 1), // Only 1 question for simplicity
      error: null,
      message: null,
    });
    mockedSubmitOnboardingResult.mockResolvedValue({
      data: { initial_levels: { algebra: 2, geometry: 1 } },
      error: null,
      message: null,
    });

    render(<OnboardingPage />);

    const user = userEvent.setup();
    // Select goal
    await user.click(screen.getByText("SAT Math"));

    // Answer the single question
    await waitFor(() => {
      expect(screen.getByText("Завершить")).toBeInTheDocument();
    });

    await user.click(screen.getByText("A").closest("button")!);
    await user.click(screen.getByText("Завершить"));

    // Results screen
    await waitFor(() => {
      expect(screen.getByText("Оценка завершена!")).toBeInTheDocument();
    });

    expect(screen.getByText("Начать практику!")).toBeInTheDocument();
    expect(screen.getByText("Уровень 2")).toBeInTheDocument();
    expect(screen.getByText("Уровень 1")).toBeInTheDocument();
  });

  it("calls setGoal with 'general' when Общая практика is clicked", async () => {
    mockedSetGoal.mockResolvedValue({ data: null, error: null, message: null });
    mockedFetchOnboardingTest.mockResolvedValue({
      data: mockOnboardingQuestions,
      error: null,
      message: null,
    });

    render(<OnboardingPage />);

    const user = userEvent.setup();
    await user.click(screen.getByText("Общая практика"));

    expect(mockedSetGoal).toHaveBeenCalledWith("general");
  });
});
