/** Theory store — article list, current article, quiz state. */

import { create } from "zustand";
import { fetchTheoryList, fetchTheoryArticle, submitTheoryQuiz } from "../functions/client";
import type { TheoryArticleItem, TheoryArticleResponse, QuizSubmitResponse, Question } from "../types";

/** How long cached data is considered fresh (ms). */
const STALE_AFTER_MS = 300_000; // 5 minutes

interface TheoryState {
  /** List of all theory articles with progress. */
  articles: TheoryArticleItem[];
  /** Currently viewed article. */
  currentArticle: TheoryArticleResponse | null;
  /** Quiz questions for current article. */
  quizQuestions: Question[];
  /** User's selected answers for quiz (question_id -> option_index). */
  quizAnswers: Record<string, number>;
  /** Quiz submission result. */
  quizResult: QuizSubmitResponse | null;
  /** Loading states. */
  isLoadingList: boolean;
  isLoadingArticle: boolean;
  isSubmittingQuiz: boolean;
  /** Error messages. */
  listError: string | null;
  articleError: string | null;
  quizError: string | null;
  /** Timestamp of last successful articles fetch. */
  lastFetchedAt: number;

  /** Load list of all theory articles — shows cached data instantly, refreshes in background if stale. */
  load: () => Promise<void>;
  /** Prefetch articles list (alias for load, for clarity in App.tsx). */
  prefetch: () => Promise<void>;
  /** Load a specific article by subtopic. */
  loadArticle: (subtopic: string) => Promise<void>;
  /** Load quiz questions for current article. */
  loadQuizQuestions: (questionIds: string[]) => Promise<void>;
  /** Select an answer for a quiz question. */
  selectQuizAnswer: (questionId: string, optionIndex: number) => void;
  /** Submit quiz answers. */
  submitQuiz: () => Promise<void>;
  /** Reset quiz state (for retrying). */
  resetQuiz: () => void;
  /** Clear current article and return to list. */
  clearArticle: () => void;
}

export const useTheoryStore = create<TheoryState>((set, get) => ({
  articles: [],
  currentArticle: null,
  quizQuestions: [],
  quizAnswers: {},
  quizResult: null,
  isLoadingList: false,
  isLoadingArticle: false,
  isSubmittingQuiz: false,
  listError: null,
  articleError: null,
  quizError: null,
  lastFetchedAt: 0,

  load: async () => {
    const { articles, lastFetchedAt, isLoadingList } = get();

    // Already loading — skip duplicate request
    if (isLoadingList) return;

    const isFresh = articles.length > 0 && Date.now() - lastFetchedAt < STALE_AFTER_MS;

    if (isFresh) {
      // Data is fresh — no fetch needed
      return;
    }

    if (articles.length > 0) {
      // Stale data exists — show it, refresh in background (no loading spinner)
      fetchTheoryList().then((response) => {
        if (response.data) {
          set({ articles: response.data.articles, lastFetchedAt: Date.now(), listError: null });
        }
      });
      return;
    }

    // No cached data — show loading spinner
    set({ isLoadingList: true, listError: null });
    try {
      const response = await fetchTheoryList();
      if (response.data) {
        set({ articles: response.data.articles, isLoadingList: false, lastFetchedAt: Date.now(), listError: null });
      } else {
        set({ isLoadingList: false, listError: response.error || "Ошибка загрузки" });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Ошибка сети";
      set({ isLoadingList: false, listError: msg });
    }
  },

  prefetch: async () => {
    // Alias for load() — for clarity when called from App.tsx
    return get().load();
  },

  loadArticle: async (subtopic: string) => {
    set({ isLoadingArticle: true, articleError: null, currentArticle: null, quizResult: null });
    try {
      const response = await fetchTheoryArticle(subtopic);
      if (response.data) {
        set({ currentArticle: response.data, isLoadingArticle: false });
      } else {
        set({ isLoadingArticle: false, articleError: response.error || "Статья не найдена" });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Ошибка сети";
      set({ isLoadingArticle: false, articleError: msg });
    }
  },

  loadQuizQuestions: async (_questionIds: string[]) => {
    // TODO: Fetch quiz questions from backend
    // For now, we'll fetch them when rendering the quiz
    set({ quizQuestions: [] });
  },

  selectQuizAnswer: (questionId: string, optionIndex: number) => {
    const { quizAnswers } = get();
    set({ quizAnswers: { ...quizAnswers, [questionId]: optionIndex } });
  },

  submitQuiz: async () => {
    const { currentArticle, quizAnswers, isSubmittingQuiz } = get();
    if (!currentArticle || isSubmittingQuiz) return;

    console.log('Submitting quiz:', { subtopic: currentArticle.subtopic, answers: quizAnswers });
    set({ isSubmittingQuiz: true, quizError: null });

    try {
      const response = await submitTheoryQuiz(currentArticle.subtopic, quizAnswers);
      console.log('Quiz response:', response);
      
      if (response.data) {
        set({ quizResult: response.data, isSubmittingQuiz: false });

        // Haptic feedback
        const tg = window.Telegram?.WebApp;
        if (tg?.HapticFeedback) {
          if (response.data.passed) {
            tg.HapticFeedback.notificationOccurred("success");
          } else {
            tg.HapticFeedback.notificationOccurred("warning");
          }
        }
      } else {
        console.error('Quiz error:', response.error);
        set({ isSubmittingQuiz: false, quizError: response.error || "Ошибка отправки" });
      }
    } catch (e) {
      console.error('Quiz exception:', e);
      const msg = e instanceof Error ? e.message : "Ошибка сети";
      set({ isSubmittingQuiz: false, quizError: msg });
    }
  },

  resetQuiz: () => {
    set({ quizAnswers: {}, quizResult: null, quizError: null });
  },

  clearArticle: () => {
    set({
      currentArticle: null,
      quizQuestions: [],
      quizAnswers: {},
      quizResult: null,
      articleError: null,
      quizError: null,
    });
  },
}));
