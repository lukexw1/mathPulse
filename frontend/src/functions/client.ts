/** API client for communicating with the FastAPI backend. */

import type { ApiResponse } from "../types";
import i18n from "../i18n";

const API_URL = import.meta.env.VITE_API_URL || "";

/** Get the current user ID from Telegram context. */
function getUserId(): number {
  return window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 0;
}

/** Get the current user language from i18next. */
function getUserLanguage(): string {
  return i18n.language || "en";
}

/** Fetch with timeout (default 30s). */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = 30000,
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

/** Wake the backend if it's sleeping (Render free tier cold start). */
async function wakeBackend(): Promise<void> {
  try {
    await fetchWithTimeout(`${API_URL}/health`, { method: "GET" }, 60000);
  } catch {
    // Ignore — we'll retry the actual request anyway
  }
}

/** Make an authenticated API request with retry on cold start. */
async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const url = `${API_URL}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept-Language": getUserLanguage(),
    "X-User-Id": String(getUserId()),
    ...(options.headers as Record<string, string> || {}),
  };

  const fetchOptions: RequestInit = { ...options, headers };

  let response: Response;
  try {
    response = await fetchWithTimeout(url, fetchOptions, 15000);
  } catch {
    // First attempt failed — backend might be cold-starting.
    // Wake it up and retry once.
    await wakeBackend();
    response = await fetchWithTimeout(url, fetchOptions, 30000);
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return {
      data: null as T,
      error: errorData.detail || `HTTP ${response.status}`,
      message: null,
    };
  }

  return response.json();
}

/** Authentication */
export async function authenticateTelegram(initData: string) {
  return request<{ id: number; first_name: string; is_new: boolean }>(
    "/api/auth/telegram",
    {
      method: "POST",
      body: JSON.stringify({ init_data: initData }),
    },
  );
}

/** Dashboard */
export async function fetchDashboard() {
  return request<import("../types").DashboardData>("/api/dashboard");
}

/** Onboarding */
export async function setGoal(goal: string) {
  return request("/api/onboarding/goal", {
    method: "POST",
    body: JSON.stringify({ goal }),
  });
}

export async function fetchOnboardingTest() {
  return request<import("../types").Question[]>("/api/onboarding/test");
}

export async function submitOnboardingResult(answers: Array<{ question_id: string; answer: string; is_correct: boolean }>) {
  return request("/api/onboarding/result", {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
}

/** Questions */
export async function fetchNextQuestion(excludeIds: string[] = []) {
  const params = excludeIds.length > 0 ? `?exclude=${excludeIds.join(",")}` : "";
  return request<import("../types").Question>(`/api/questions/next${params}`);
}

export async function fetchQuestionBatch(count = 12) {
  return request<import("../types").Question[]>(`/api/questions/batch?count=${count}`);
}

export async function fetchQuestionsByIds(ids: string[]) {
  return request<import("../types").Question[]>(`/api/questions/by-ids?ids=${ids.join(",")}`);
}

export async function submitAnswer(questionId: string, answer: string, timeSpentMs: number, hintUsed: boolean) {
  return request<import("../types").AnswerResult>(
    `/api/questions/${questionId}/answer`,
    {
      method: "POST",
      body: JSON.stringify({
        answer,
        time_spent_ms: timeSpentMs,
        hint_used: hintUsed,
      }),
    },
  );
}

/** Review */
export async function fetchDueReviews() {
  return request<import("../types").Question[]>("/api/review/due");
}

export async function rateReview(questionId: string, quality: number) {
  return request(`/api/review/${questionId}/rate`, {
    method: "POST",
    body: JSON.stringify({ quality }),
  });
}

/** Profile */
export async function fetchProfile() {
  return request("/api/profile");
}

export async function fetchStatsSummary() {
  return request("/api/stats/summary");
}

/** Theory */
export async function fetchTheoryList() {
  return request<import("../types").TheoryListResponse>("/api/theory");
}

export async function fetchTheoryArticle(subtopic: string) {
  return request<import("../types").TheoryArticleResponse>(`/api/theory/${subtopic}`);
}

export async function submitTheoryQuiz(subtopic: string, answers: Record<string, number>) {
  return request<import("../types").QuizSubmitResponse>(
    `/api/theory/${subtopic}/quiz`,
    {
      method: "POST",
      body: JSON.stringify({ answers }),
    },
  );
}