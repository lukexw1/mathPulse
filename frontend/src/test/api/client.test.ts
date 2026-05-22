/** Tests for API client module. */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  authenticateTelegram,
  fetchDashboard,
  setGoal,
  fetchOnboardingTest,
  submitOnboardingResult,
  fetchNextQuestion,
  submitAnswer,
  fetchDueReviews,
  rateReview,
  fetchProfile,
  fetchStatsSummary,
} from "../../functions/client";

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function createFetchResponse<T>(data: T, ok = true, status = 200) {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(data),
  };
}

describe("API client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("authenticateTelegram", () => {
    it("sends POST with init_data to /api/auth/telegram", async () => {
      const responseData = { data: { id: 1, first_name: "Test", is_new: false }, error: null, message: null };
      mockFetch.mockResolvedValue(createFetchResponse(responseData));

      const result = await authenticateTelegram("mock_init_data");

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain("/api/auth/telegram");
      expect(options.method).toBe("POST");
      expect(JSON.parse(options.body)).toEqual({ init_data: "mock_init_data" });
      expect(result).toEqual(responseData);
    });

    it("returns error on non-ok response", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: vi.fn().mockResolvedValue({ detail: "Invalid init data" }),
      });

      const result = await authenticateTelegram("bad_data");

      expect(result.error).toBe("Invalid init data");
      expect(result.data).toBeNull();
    });

    it("returns HTTP status on non-JSON error response", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn().mockRejectedValue(new Error("not json")),
      });

      const result = await authenticateTelegram("data");

      expect(result.error).toBe("HTTP 500");
    });
  });

  describe("fetchDashboard", () => {
    it("sends GET to /api/dashboard", async () => {
      const responseData = { data: { xp: 100 }, error: null, message: null };
      mockFetch.mockResolvedValue(createFetchResponse(responseData));

      await fetchDashboard();

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain("/api/dashboard");
      expect(options.method).toBeUndefined(); // GET is default
    });
  });

  describe("setGoal", () => {
    it("sends POST with goal to /api/onboarding/goal", async () => {
      mockFetch.mockResolvedValue(createFetchResponse({ data: null, error: null, message: null }));

      await setGoal("sat");

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain("/api/onboarding/goal");
      expect(options.method).toBe("POST");
      expect(JSON.parse(options.body)).toEqual({ goal: "sat" });
    });
  });

  describe("fetchOnboardingTest", () => {
    it("sends GET to /api/onboarding/test", async () => {
      mockFetch.mockResolvedValue(createFetchResponse({ data: [], error: null, message: null }));

      await fetchOnboardingTest();

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain("/api/onboarding/test");
    });
  });

  describe("submitOnboardingResult", () => {
    it("sends POST with answers to /api/onboarding/result", async () => {
      mockFetch.mockResolvedValue(createFetchResponse({ data: { initial_levels: {} }, error: null, message: null }));

      const answers = [{ question_id: "q1", answer: "A", is_correct: true }];
      await submitOnboardingResult(answers);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain("/api/onboarding/result");
      expect(options.method).toBe("POST");
      expect(JSON.parse(options.body)).toEqual({ answers });
    });
  });

  describe("fetchNextQuestion", () => {
    it("sends GET to /api/questions/next", async () => {
      mockFetch.mockResolvedValue(createFetchResponse({ data: { id: "q1" }, error: null, message: null }));

      await fetchNextQuestion();

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain("/api/questions/next");
      expect(url).not.toContain("exclude");
    });

    it("sends exclude query param when IDs are provided", async () => {
      mockFetch.mockResolvedValue(createFetchResponse({ data: { id: "q3" }, error: null, message: null }));

      await fetchNextQuestion(["q1", "q2"]);

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain("/api/questions/next?exclude=q1,q2");
    });
  });

  describe("submitAnswer", () => {
    it("sends POST with answer data to /api/questions/:id/answer", async () => {
      mockFetch.mockResolvedValue(createFetchResponse({ data: { is_correct: true }, error: null, message: null }));

      await submitAnswer("q-001", "B", 5000, false);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain("/api/questions/q-001/answer");
      expect(options.method).toBe("POST");
      expect(JSON.parse(options.body)).toEqual({
        answer: "B",
        time_spent_ms: 5000,
        hint_used: false,
      });
    });

    it("sends hint_used=true when hint was used", async () => {
      mockFetch.mockResolvedValue(createFetchResponse({ data: { is_correct: false }, error: null, message: null }));

      await submitAnswer("q-001", "A", 3000, true);

      const [, options] = mockFetch.mock.calls[0];
      expect(JSON.parse(options.body).hint_used).toBe(true);
    });
  });

  describe("fetchDueReviews", () => {
    it("sends GET to /api/review/due", async () => {
      mockFetch.mockResolvedValue(createFetchResponse({ data: [], error: null, message: null }));

      await fetchDueReviews();

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain("/api/review/due");
    });
  });

  describe("rateReview", () => {
    it("sends POST with quality to /api/review/:id/rate", async () => {
      mockFetch.mockResolvedValue(createFetchResponse({ data: null, error: null, message: null }));

      await rateReview("q-001", 4);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain("/api/review/q-001/rate");
      expect(options.method).toBe("POST");
      expect(JSON.parse(options.body)).toEqual({ quality: 4 });
    });
  });

  describe("fetchProfile", () => {
    it("sends GET to /api/profile", async () => {
      mockFetch.mockResolvedValue(createFetchResponse({ data: { id: 1 }, error: null, message: null }));

      await fetchProfile();

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain("/api/profile");
    });
  });

  describe("fetchStatsSummary", () => {
    it("sends GET to /api/stats/summary", async () => {
      mockFetch.mockResolvedValue(createFetchResponse({ data: {}, error: null, message: null }));

      await fetchStatsSummary();

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain("/api/stats/summary");
    });
  });

  describe("request headers", () => {
    it("includes Content-Type and X-User-Id headers", async () => {
      mockFetch.mockResolvedValue(createFetchResponse({ data: {}, error: null, message: null }));

      await fetchDashboard();

      const [, options] = mockFetch.mock.calls[0];
      expect(options.headers["Content-Type"]).toBe("application/json");
      expect(options.headers["X-User-Id"]).toBe("123456"); // from Telegram mock in setup.ts
    });
  });
});
