/** Tests for PracticePage component. */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { PracticePage } from "../../pages/PracticePage";
import { usePracticeStore } from "../../stores/practiceStore";
import { useAuthStore } from "../../stores/authStore";
import { mockQuestion, mockCorrectResult, mockIncorrectResult } from "../fixtures";
import type { Question, AnswerResult } from "../../types";

// Mock the practice store to avoid API calls entirely
vi.mock("../../stores/practiceStore");
const mockedUsePracticeStore = vi.mocked(usePracticeStore);

// Mock the auth store
vi.mock("../../stores/authStore");
const mockedUseAuthStore = vi.mocked(useAuthStore);

function createMockStore(overrides: Partial<ReturnType<typeof usePracticeStore>> = {}) {
  return {
    currentQuestion: null as Question | null,
    questionQueue: [] as Question[],
    result: null as AnswerResult | null,
    isLoading: false,
    selectedAnswer: null as string | null,
    hintUsed: false,
    hintVisible: false,
    questionNumber: 1,
    totalQuestions: 12,
    showSolution: false,
    previousLevel: 1,
    loadNextQuestion: vi.fn(),
    selectAnswer: vi.fn(),
    submit: vi.fn(),
    showHint: vi.fn(),
    openSolution: vi.fn(),
    closeSolution: vi.fn(),
    setPreviousLevel: vi.fn(),
    reset: vi.fn(),
    startTime: 0,
    ...overrides,
  };
}

function renderPracticePage() {
  return render(
    <MemoryRouter>
      <PracticePage />
    </MemoryRouter>,
  );
}

describe("PracticePage", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Default auth store mock — returns user with level 1
    mockedUseAuthStore.mockImplementation((selector: unknown) => {
      const state = { user: { level: 1 }, isAuthenticated: true, isLoading: false, error: null, authenticate: vi.fn() };
      return typeof selector === "function" ? (selector as (s: typeof state) => unknown)(state) : state;
    });
  });

  it("shows loading skeletons when loading", () => {
    mockedUsePracticeStore.mockReturnValue(createMockStore({ isLoading: true }));
    const { container } = renderPracticePage();
    const skeletons = container.querySelectorAll(".skeleton");
    expect(skeletons.length).toBeGreaterThanOrEqual(3);
  });

  it("shows 'Нет доступных вопросов' when no question is returned", () => {
    mockedUsePracticeStore.mockReturnValue(createMockStore({
      isLoading: false,
      currentQuestion: null,
    }));

    renderPracticePage();

    expect(screen.getByText("Нет доступных вопросов")).toBeInTheDocument();
    expect(screen.getByText("Попробовать снова")).toBeInTheDocument();
  });

  it("calls loadNextQuestion when Попробовать снова is clicked", async () => {
    const mockLoad = vi.fn();
    mockedUsePracticeStore.mockReturnValue(createMockStore({
      isLoading: false,
      currentQuestion: null,
      loadNextQuestion: mockLoad,
    }));

    renderPracticePage();

    const user = userEvent.setup();
    await user.click(screen.getByText("Попробовать снова"));

    expect(mockLoad).toHaveBeenCalled();
  });

  it("renders question with question number label", () => {
    mockedUsePracticeStore.mockReturnValue(createMockStore({
      currentQuestion: mockQuestion,
    }));

    renderPracticePage();

    // New design shows "Задача #1" label
    expect(screen.getByText("Задача #1")).toBeInTheDocument();
  });

  it("renders question number", () => {
    mockedUsePracticeStore.mockReturnValue(createMockStore({
      currentQuestion: mockQuestion,
      questionNumber: 5,
    }));

    renderPracticePage();

    expect(screen.getByText("Задача #5")).toBeInTheDocument();
  });

  it("renders answer choices from the question", () => {
    mockedUsePracticeStore.mockReturnValue(createMockStore({
      currentQuestion: mockQuestion,
    }));

    renderPracticePage();

    // Answer labels are rendered as plain "A", "B", etc. in the new design
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("C")).toBeInTheDocument();
    expect(screen.getByText("D")).toBeInTheDocument();
  });

  it("disables Ответить button until an answer is selected", () => {
    mockedUsePracticeStore.mockReturnValue(createMockStore({
      currentQuestion: mockQuestion,
      selectedAnswer: null,
    }));

    renderPracticePage();

    const submitBtn = screen.getByText("Ответить");
    expect(submitBtn).toBeDisabled();
  });

  it("enables Ответить button when an answer is selected", () => {
    mockedUsePracticeStore.mockReturnValue(createMockStore({
      currentQuestion: mockQuestion,
      selectedAnswer: "B",
    }));

    renderPracticePage();

    const submitBtn = screen.getByText("Ответить");
    expect(submitBtn).not.toBeDisabled();
  });

  it("shows Подсказка button when question has a hint", () => {
    mockedUsePracticeStore.mockReturnValue(createMockStore({
      currentQuestion: mockQuestion, // has hint
      hintVisible: false,
    }));

    renderPracticePage();

    expect(screen.getByText("Подсказка")).toBeInTheDocument();
  });

  it("shows hint text when hintVisible is true", () => {
    mockedUsePracticeStore.mockReturnValue(createMockStore({
      currentQuestion: mockQuestion,
      hintVisible: true,
    }));

    renderPracticePage();

    expect(screen.getByText(mockQuestion.hint!)).toBeInTheDocument();
    // Подсказка button should be hidden when hint is visible
    expect(screen.queryByText("Подсказка")).not.toBeInTheDocument();
  });

  it("calls showHint when Подсказка button is clicked", async () => {
    const mockShowHint = vi.fn();
    mockedUsePracticeStore.mockReturnValue(createMockStore({
      currentQuestion: mockQuestion,
      hintVisible: false,
      showHint: mockShowHint,
    }));

    renderPracticePage();

    const user = userEvent.setup();
    await user.click(screen.getByText("Подсказка"));

    expect(mockShowHint).toHaveBeenCalled();
  });

  it("shows result footer with correct feedback", () => {
    mockedUsePracticeStore.mockReturnValue(createMockStore({
      currentQuestion: mockQuestion,
      result: mockCorrectResult,
    }));

    renderPracticePage();

    expect(screen.getByText("Правильно!")).toBeInTheDocument();
  });

  it("shows incorrect result footer", () => {
    mockedUsePracticeStore.mockReturnValue(createMockStore({
      currentQuestion: mockQuestion,
      result: mockIncorrectResult,
    }));

    renderPracticePage();

    expect(screen.getByText("Неправильно")).toBeInTheDocument();
  });

  it("shows solution button in result footer", () => {
    mockedUsePracticeStore.mockReturnValue(createMockStore({
      currentQuestion: mockQuestion,
      result: mockCorrectResult,
    }));

    renderPracticePage();

    expect(screen.getByLabelText("Показать решение")).toBeInTheDocument();
  });

  it("calls openSolution when solution button is clicked", async () => {
    const mockOpen = vi.fn();
    mockedUsePracticeStore.mockReturnValue(createMockStore({
      currentQuestion: mockQuestion,
      result: mockCorrectResult,
      openSolution: mockOpen,
    }));

    renderPracticePage();

    const user = userEvent.setup();
    await user.click(screen.getByLabelText("Показать решение"));

    expect(mockOpen).toHaveBeenCalled();
  });

  it("renders SolutionView when showSolution is true", () => {
    mockedUsePracticeStore.mockReturnValue(createMockStore({
      currentQuestion: mockQuestion,
      result: mockCorrectResult,
      showSolution: true,
    }));

    renderPracticePage();

    // SolutionView shows "Правильно" (without exclamation) and step-by-step
    expect(screen.getByText("Правильно")).toBeInTheDocument();
    expect(screen.getByText("Шаги решения")).toBeInTheDocument();
    expect(screen.getByText("Следующий вопрос")).toBeInTheDocument();
  });

  it("sets up BackButton on mount", () => {
    mockedUsePracticeStore.mockReturnValue(createMockStore({
      currentQuestion: mockQuestion,
    }));

    renderPracticePage();

    expect(window.Telegram?.WebApp?.BackButton.show).toHaveBeenCalled();
  });
});
