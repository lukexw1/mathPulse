/** Practice store — question state, answer tracking, timing. */

import { create } from "zustand";
import { fetchNextQuestion, fetchQuestionBatch, submitAnswer } from "../functions/client";
import type { AnswerResult, Question } from "../types";

/** Number of questions per practice session. */
const SESSION_SIZE = 12;

/** How long prefetched questions are considered valid (ms). */
const PREFETCH_VALID_MS = 300_000; // 5 minutes

/** At which question number we trigger a background refill (e.g. 9 = 3 questions left). */
const REFILL_AT = 9;

interface PracticeState {
  currentQuestion: Question | null;
  /** Preloaded questions waiting to be shown. */
  questionQueue: Question[];
  result: AnswerResult | null;
  isLoading: boolean;
  isSubmitting: boolean;
  /** Whether a background batch fetch is in progress to refill the queue. */
  isRefilling: boolean;
  submitError: string | null;
  selectedAnswer: string | null;
  hintUsed: boolean;
  hintVisible: boolean;
  startTime: number;
  questionNumber: number;
  /** Total questions in this session (set from batch size). */
  totalQuestions: number;
  /** Question IDs shown this session — sent to backend to prevent repeats. */
  sessionQuestionIds: string[];
  /** FR-16: Whether to show full solution view. */
  showSolution: boolean;
  /** FR-28: Level before the current answer, for level-up detection. */
  previousLevel: number;
  /** Timestamp when questions were prefetched. */
  prefetchedAt: number;

  loadNextQuestion: () => Promise<void>;
  selectAnswer: (answer: string) => void;
  submit: () => Promise<void>;
  showHint: () => void;
  /** FR-16: Transition to full solution view. */
  openSolution: () => void;
  /** FR-16: Go back from solution to question (for BackButton). */
  closeSolution: () => void;
  /** FR-28: Set the user's current level before answering. */
  setPreviousLevel: (level: number) => void;
  /** Prefetch first question and batch for instant practice start. */
  prefetch: () => Promise<void>;
  /** Trigger a background refill of the question queue (private, used internally). */
  refillQueue: (excludeIds: string[]) => Promise<void>;
  reset: () => void;
}

export const usePracticeStore = create<PracticeState>((set, get) => ({
  currentQuestion: null,
  questionQueue: [],
  result: null,
  isLoading: false,
  isSubmitting: false,
  isRefilling: false,
  submitError: null,
  selectedAnswer: null,
  hintUsed: false,
  hintVisible: false,
  startTime: 0,
  questionNumber: 0,
  totalQuestions: SESSION_SIZE,
  sessionQuestionIds: [],
  showSolution: false,
  previousLevel: 1,
  prefetchedAt: 0,

  prefetch: async () => {
    const { questionQueue, prefetchedAt, questionNumber } = get();

    // Skip if already prefetched recently or if session is in progress
    if (questionNumber > 0) return;
    if (questionQueue.length > 0 && Date.now() - prefetchedAt < PREFETCH_VALID_MS) return;

    try {
      // Fetch first question + batch in parallel
      const [firstResponse, batchResponse] = await Promise.all([
        fetchNextQuestion([]),
        fetchQuestionBatch(SESSION_SIZE - 1),
      ]);

      if (firstResponse.data && batchResponse.data) {
        // Filter out first question from batch if backend returned it
        const remaining = batchResponse.data.filter(q => q.id !== firstResponse.data.id);
        set({
          questionQueue: [firstResponse.data, ...remaining],
          totalQuestions: 1 + remaining.length,
          prefetchedAt: Date.now(),
        });
      }
    } catch {
      // Prefetch failed — user will see loading when they open practice
    }
  },

  /** Trigger a background refill of the question queue. */
  refillQueue: async (excludeIds: string[]) => {
    const { isRefilling } = get();
    if (isRefilling) return; // Already refilling — skip duplicate

    set({ isRefilling: true });
    try {
      const batchResponse = await fetchQuestionBatch(SESSION_SIZE);
      if (batchResponse.data) {
        // Filter out already-shown questions
        const fresh = batchResponse.data.filter(q => !excludeIds.includes(q.id));
        set((state) => ({
          questionQueue: [...state.questionQueue, ...fresh],
          totalQuestions: state.totalQuestions + fresh.length,
          isRefilling: false,
        }));
      } else {
        set({ isRefilling: false });
      }
    } catch {
      set({ isRefilling: false });
    }
  },

  loadNextQuestion: async () => {
    const { questionQueue, questionNumber, totalQuestions, prefetchedAt, isRefilling } = get();

    // If we already have questions in the queue, pop the next one locally
    if (questionQueue.length > 0) {
      const [next, ...rest] = questionQueue;
      set({
        currentQuestion: next,
        questionQueue: rest,
        result: null,
        selectedAnswer: null,
        hintUsed: false,
        hintVisible: false,
        submitError: null,
        showSolution: false,
        startTime: Date.now(),
        questionNumber: questionNumber + 1,
        sessionQuestionIds: [...get().sessionQuestionIds, next.id],
      });

      // Trigger background refill when we reach the refill threshold
      // and we're not already refilling
      const newNum = questionNumber + 1;
      if (newNum >= REFILL_AT && !isRefilling) {
        const newSessionIds = [...get().sessionQuestionIds, next.id];
        get().refillQueue(newSessionIds);
      }
      return;
    }

    // First load — check if we have valid prefetched data
    if (questionNumber === 0) {
      const hasPrefetch = questionQueue.length > 0 && Date.now() - prefetchedAt < PREFETCH_VALID_MS;
      
      if (hasPrefetch) {
        // Use prefetched data instantly
        const [next, ...rest] = questionQueue;
        set({
          currentQuestion: next,
          questionQueue: rest,
          result: null,
          selectedAnswer: null,
          hintUsed: false,
          hintVisible: false,
          submitError: null,
          showSolution: false,
          startTime: Date.now(),
          questionNumber: 1,
          sessionQuestionIds: [next.id],
        });
        return;
      }

      // No valid prefetch — fetch first question immediately, then batch the rest in background
      set({ isLoading: true, result: null, selectedAnswer: null, hintUsed: false, hintVisible: false, submitError: null, showSolution: false });
      try {
        // Fetch first question immediately
        const firstResponse = await fetchNextQuestion([]);
        if (firstResponse.data) {
          set({
            currentQuestion: firstResponse.data,
            isLoading: false,
            startTime: Date.now(),
            questionNumber: 1,
            totalQuestions: SESSION_SIZE,
            sessionQuestionIds: [firstResponse.data.id],
          });

          // Background: fetch remaining questions
          fetchQuestionBatch(SESSION_SIZE - 1).then((batchResponse) => {
            if (batchResponse.data && batchResponse.data.length > 0) {
              const remaining = batchResponse.data.filter(q => q.id !== firstResponse.data.id);
              set({
                questionQueue: remaining,
                totalQuestions: 1 + remaining.length,
              });
            }
          }).catch(() => {
            // Background fetch failed — user can still continue with first question
          });
        } else {
          set({ isLoading: false });
        }
      } catch {
        set({ isLoading: false });
      }
      return;
    }

    // Queue exhausted mid-session
    // If a refill is in progress, wait for it by showing loading state briefly
    if (isRefilling) {
      set({ isLoading: true });
      // Poll for refill completion (max 5s)
      const pollStart = Date.now();
      const poll = setInterval(() => {
        const st = get();
        if (!st.isRefilling && st.questionQueue.length > 0) {
          clearInterval(poll);
          // Recurse to pick up the refilled questions
          get().loadNextQuestion();
        } else if (Date.now() - pollStart > 5000) {
          clearInterval(poll);
          set({ isLoading: false, currentQuestion: null });
        }
      }, 200);
      return;
    }

    // No more questions — session is over
    if (questionNumber >= totalQuestions) {
      set({
        currentQuestion: null,
        result: null,
        selectedAnswer: null,
        showSolution: false,
      });
    }
  },

  selectAnswer: (answer: string) => {
    if (!get().result) {
      set({ selectedAnswer: answer });
    }
  },

  submit: async () => {
    const { currentQuestion, selectedAnswer, hintUsed, startTime, isSubmitting } = get();
    if (!currentQuestion || !selectedAnswer || isSubmitting) return;

    set({ isSubmitting: true, submitError: null });
    const timeSpentMs = Date.now() - startTime;

    try {
      const response = await submitAnswer(
        currentQuestion.id,
        selectedAnswer,
        timeSpentMs,
        hintUsed,
      );

      if (response.data) {
        set({ result: response.data, isSubmitting: false });

        // FR-40: Haptic feedback
        const tg = window.Telegram?.WebApp;
        if (tg?.HapticFeedback) {
          if (response.data.is_correct) {
            tg.HapticFeedback.notificationOccurred("success");
          } else {
            tg.HapticFeedback.notificationOccurred("error");
          }
        }
      } else {
        set({ isSubmitting: false, submitError: response.error || "Ошибка сервера" });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Ошибка сети";
      set({ isSubmitting: false, submitError: msg });
    }
  },

  showHint: () => {
    set({ hintUsed: true, hintVisible: true });
  },

  openSolution: () => {
    set({ showSolution: true });
  },

  closeSolution: () => {
    set({ showSolution: false });
  },

  setPreviousLevel: (level: number) => {
    set({ previousLevel: level });
  },

  reset: () => {
    set({
      currentQuestion: null,
      questionQueue: [],
      result: null,
      selectedAnswer: null,
      hintUsed: false,
      hintVisible: false,
      startTime: 0,
      questionNumber: 0,
      totalQuestions: SESSION_SIZE,
      sessionQuestionIds: [],
      isSubmitting: false,
      isRefilling: false,
      submitError: null,
      showSolution: false,
      previousLevel: 1,
      prefetchedAt: 0,
    });
  },
}));