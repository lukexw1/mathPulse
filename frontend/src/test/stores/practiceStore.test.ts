/** Tests for practiceStore — question flow, answer submission, hints. */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePracticeStore } from "../../stores/practiceStore";
import { mockQuestion, mockCorrectResult, mockIncorrectResult } from "../fixtures";
import type { Question } from "../../types";

// Mock the API client
vi.mock("../../api/client", () => ({
  fetchNextQuestion: vi.fn(),
  fetchQuestionBatch: vi.fn(),
  submitAnswer: vi.fn(),
}));

import { fetchNextQuestion, fetchQuestionBatch, submitAnswer } from "../../functions/client";

const mockFetchNext = vi.mocked(fetchNextQuestion);
const mockFetchBatch = vi.mocked(fetchQuestionBatch);
const mockSubmitAnswer = vi.mocked(submitAnswer);

/** Helper: create a batch of N distinct questions based on mockQuestion. */
function makeBatch(count: number): Question[] {
  return Array.from({ length: count }, (_, i) => ({
    ...mockQuestion,
    id: `q-${String(i + 1).padStart(3, "0")}`,
  }));
}

describe("practiceStore", () => {
  beforeEach(() => {
    usePracticeStore.getState().reset();
    vi.clearAllMocks();
  });

  it("has correct initial state after reset", () => {
    const state = usePracticeStore.getState();
    expect(state.currentQuestion).toBeNull();
    expect(state.questionQueue).toEqual([]);
    expect(state.result).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.selectedAnswer).toBeNull();
    expect(state.hintUsed).toBe(false);
    expect(state.hintVisible).toBe(false);
    expect(state.questionNumber).toBe(0);
    expect(state.sessionQuestionIds).toEqual([]);
  });

  describe("loadNextQuestion", () => {
    it("fetches first question immediately, then batch in background", async () => {
      const first = { ...mockQuestion, id: "q-first" };
      const batch = makeBatch(2); // q-001, q-002
      
      mockFetchNext.mockResolvedValueOnce({
        data: first,
        error: null,
        message: null,
      });
      
      mockFetchBatch.mockResolvedValueOnce({
        data: batch,
        error: null,
        message: null,
      });

      await usePracticeStore.getState().loadNextQuestion();

      const state = usePracticeStore.getState();
      expect(state.currentQuestion).toEqual(first);
      expect(state.isLoading).toBe(false);
      expect(state.questionNumber).toBe(1);
      expect(state.startTime).toBeGreaterThan(0);
      expect(state.sessionQuestionIds).toEqual([first.id]);
      
      // Wait for background batch to complete
      await vi.waitFor(() => {
        expect(usePracticeStore.getState().questionQueue.length).toBe(2);
      }, { timeout: 1000 });
      
      expect(usePracticeStore.getState().questionQueue).toEqual(batch);
      expect(usePracticeStore.getState().totalQuestions).toBe(3); // 1 + 2
    });

    it("fetches first via /next only once, then pops from queue", async () => {
      const first = { ...mockQuestion, id: "q-first" };
      const batch = makeBatch(2); // q-001, q-002
      
      mockFetchNext.mockResolvedValueOnce({
        data: first,
        error: null,
        message: null,
      });
      
      mockFetchBatch.mockResolvedValueOnce({
        data: batch,
        error: null,
        message: null,
      });

      // First call — fetches first question
      await usePracticeStore.getState().loadNextQuestion();
      expect(mockFetchNext).toHaveBeenCalledTimes(1);
      expect(usePracticeStore.getState().currentQuestion).toEqual(first);

      // Wait for background batch
      await vi.waitFor(() => {
        expect(usePracticeStore.getState().questionQueue.length).toBe(2);
      }, { timeout: 1000 });

      // Second call — pops from queue, no API call
      await usePracticeStore.getState().loadNextQuestion();
      expect(mockFetchNext).toHaveBeenCalledTimes(1); // still 1
      expect(mockFetchBatch).toHaveBeenCalledTimes(1); // still 1
      expect(usePracticeStore.getState().currentQuestion).toEqual(batch[0]);

      // Third call — pops last from queue
      await usePracticeStore.getState().loadNextQuestion();
      expect(mockFetchNext).toHaveBeenCalledTimes(1); // still 1
      expect(usePracticeStore.getState().currentQuestion).toEqual(batch[1]);
    });

    it("resets answer/hint/result state when loading new question", async () => {
      // Set some state first
      const batch = makeBatch(2);
      usePracticeStore.setState({
        currentQuestion: batch[0],
        questionQueue: batch.slice(1),
        questionNumber: 1,
        totalQuestions: 2,
        selectedAnswer: "B",
        hintUsed: true,
        hintVisible: true,
        result: mockCorrectResult,
        sessionQuestionIds: [batch[0].id],
      });

      await usePracticeStore.getState().loadNextQuestion();

      const state = usePracticeStore.getState();
      expect(state.selectedAnswer).toBeNull();
      expect(state.hintUsed).toBe(false);
      expect(state.hintVisible).toBe(false);
      expect(state.result).toBeNull();
    });

    it("increments questionNumber on each load", async () => {
      const first = { ...mockQuestion, id: "q-first" };
      const batch = makeBatch(2);
      
      mockFetchNext.mockResolvedValueOnce({
        data: first,
        error: null,
        message: null,
      });
      
      mockFetchBatch.mockResolvedValueOnce({
        data: batch,
        error: null,
        message: null,
      });

      await usePracticeStore.getState().loadNextQuestion();
      expect(usePracticeStore.getState().questionNumber).toBe(1);

      // Wait for background batch
      await vi.waitFor(() => {
        expect(usePracticeStore.getState().questionQueue.length).toBe(2);
      }, { timeout: 1000 });

      await usePracticeStore.getState().loadNextQuestion();
      expect(usePracticeStore.getState().questionNumber).toBe(2);

      await usePracticeStore.getState().loadNextQuestion();
      expect(usePracticeStore.getState().questionNumber).toBe(3);
    });

    it("handles API failure gracefully", async () => {
      mockFetchNext.mockResolvedValueOnce({
        data: null as unknown as Question,
        error: "No questions",
        message: null,
      });

      await usePracticeStore.getState().loadNextQuestion();

      const state = usePracticeStore.getState();
      expect(state.currentQuestion).toBeNull();
      expect(state.isLoading).toBe(false);
    });

    it("accumulates sessionQuestionIds as questions are shown", async () => {
      const first = { ...mockQuestion, id: "q-first" };
      const batch = makeBatch(2);
      
      mockFetchNext.mockResolvedValueOnce({
        data: first,
        error: null,
        message: null,
      });
      
      mockFetchBatch.mockResolvedValueOnce({
        data: batch,
        error: null,
        message: null,
      });

      await usePracticeStore.getState().loadNextQuestion();
      expect(usePracticeStore.getState().sessionQuestionIds).toEqual([first.id]);

      // Wait for background batch
      await vi.waitFor(() => {
        expect(usePracticeStore.getState().questionQueue.length).toBe(2);
      }, { timeout: 1000 });

      await usePracticeStore.getState().loadNextQuestion();
      expect(usePracticeStore.getState().sessionQuestionIds).toEqual([first.id, batch[0].id]);
    });
  });

  describe("selectAnswer", () => {
    it("sets the selected answer", () => {
      usePracticeStore.getState().selectAnswer("B");
      expect(usePracticeStore.getState().selectedAnswer).toBe("B");
    });

    it("allows changing answer before submission", () => {
      usePracticeStore.getState().selectAnswer("A");
      usePracticeStore.getState().selectAnswer("C");
      expect(usePracticeStore.getState().selectedAnswer).toBe("C");
    });

    it("prevents changing answer after result is set", () => {
      usePracticeStore.setState({ result: mockCorrectResult, selectedAnswer: "B" });
      usePracticeStore.getState().selectAnswer("D");
      expect(usePracticeStore.getState().selectedAnswer).toBe("B");
    });
  });

  describe("submit", () => {
    it("submits answer and sets correct result", async () => {
      usePracticeStore.setState({
        currentQuestion: mockQuestion,
        selectedAnswer: "B",
        startTime: Date.now() - 5000,
      });

      mockSubmitAnswer.mockResolvedValueOnce({
        data: mockCorrectResult,
        error: null,
        message: null,
      });

      await usePracticeStore.getState().submit();

      const state = usePracticeStore.getState();
      expect(state.result).toEqual(mockCorrectResult);
      expect(mockSubmitAnswer).toHaveBeenCalledWith(
        "q-001",
        "B",
        expect.any(Number),
        false,
      );
    });

    it("sends hintUsed=true when hint was used", async () => {
      usePracticeStore.setState({
        currentQuestion: mockQuestion,
        selectedAnswer: "B",
        hintUsed: true,
        startTime: Date.now() - 3000,
      });

      mockSubmitAnswer.mockResolvedValueOnce({
        data: mockCorrectResult,
        error: null,
        message: null,
      });

      await usePracticeStore.getState().submit();

      expect(mockSubmitAnswer).toHaveBeenCalledWith(
        "q-001",
        "B",
        expect.any(Number),
        true,
      );
    });

    it("triggers haptic feedback on correct answer", async () => {
      usePracticeStore.setState({
        currentQuestion: mockQuestion,
        selectedAnswer: "B",
        startTime: Date.now(),
      });

      mockSubmitAnswer.mockResolvedValueOnce({
        data: mockCorrectResult,
        error: null,
        message: null,
      });

      await usePracticeStore.getState().submit();

      expect(window.Telegram?.WebApp?.HapticFeedback.notificationOccurred).toHaveBeenCalledWith("success");
    });

    it("triggers haptic feedback on incorrect answer", async () => {
      usePracticeStore.setState({
        currentQuestion: mockQuestion,
        selectedAnswer: "A",
        startTime: Date.now(),
      });

      mockSubmitAnswer.mockResolvedValueOnce({
        data: mockIncorrectResult,
        error: null,
        message: null,
      });

      await usePracticeStore.getState().submit();

      expect(window.Telegram?.WebApp?.HapticFeedback.notificationOccurred).toHaveBeenCalledWith("error");
    });

    it("does nothing when no question or answer is selected", async () => {
      await usePracticeStore.getState().submit();
      expect(mockSubmitAnswer).not.toHaveBeenCalled();

      usePracticeStore.setState({ currentQuestion: mockQuestion });
      await usePracticeStore.getState().submit();
      expect(mockSubmitAnswer).not.toHaveBeenCalled();
    });
  });

  describe("showHint", () => {
    it("sets hintUsed and hintVisible to true", () => {
      usePracticeStore.getState().showHint();
      const state = usePracticeStore.getState();
      expect(state.hintUsed).toBe(true);
      expect(state.hintVisible).toBe(true);
    });
  });

  describe("reset", () => {
    it("resets all state to initial values", () => {
      usePracticeStore.setState({
        currentQuestion: mockQuestion,
        questionQueue: [mockQuestion],
        result: mockCorrectResult,
        selectedAnswer: "B",
        hintUsed: true,
        hintVisible: true,
        startTime: 12345,
        questionNumber: 5,
      });

      usePracticeStore.getState().reset();

      const state = usePracticeStore.getState();
      expect(state.currentQuestion).toBeNull();
      expect(state.questionQueue).toEqual([]);
      expect(state.result).toBeNull();
      expect(state.selectedAnswer).toBeNull();
      expect(state.hintUsed).toBe(false);
      expect(state.hintVisible).toBe(false);
      expect(state.questionNumber).toBe(0);
    });
  });
});
