/** Tests for authStore — Telegram authentication state. */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAuthStore } from "../../stores/authStore";

// Mock the API client
vi.mock("../../api/client", () => ({
  authenticateTelegram: vi.fn(),
}));

import { authenticateTelegram } from "../../functions/client";

const mockAuth = vi.mocked(authenticateTelegram);

describe("authStore", () => {
  beforeEach(() => {
    // Reset store state between tests
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
    });
    vi.clearAllMocks();
  });

  it("has correct initial state", () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(true);
    expect(state.error).toBeNull();
  });

  it("authenticates successfully with valid initData", async () => {
    const mockUser = {
      id: 123456,
      first_name: "Test",
      username: "testuser",
      is_new: false,
      goal: "sat",
      xp: 100,
      level: 1,
      streak_days: 3,
      photo_url: null,
    };

    mockAuth.mockResolvedValueOnce({
      data: mockUser,
      error: null,
      message: "OK",
    });

    await useAuthStore.getState().authenticate();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.isLoading).toBe(false);
    expect(state.user).toEqual(mockUser);
    expect(state.error).toBeNull();
    expect(mockAuth).toHaveBeenCalledWith("mock_init_data");
  });

  it("sets error when API returns an error", async () => {
    mockAuth.mockResolvedValueOnce({
      data: null as unknown as { id: number; first_name: string; is_new: boolean },
      error: "Invalid initData",
      message: null,
    });

    await useAuthStore.getState().authenticate();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
    // Error message now includes "Auth failed:" prefix
    expect(state.error).toBe("Auth failed: Invalid initData");
    expect(state.user).toBeNull();
  });

  it("sets error when not in Telegram context", async () => {
    // Remove Telegram context
    const origTelegram = window.Telegram;
    Object.defineProperty(window, "Telegram", { value: undefined, writable: true });

    await useAuthStore.getState().authenticate();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
    // Error message changed to describe missing SDK
    expect(state.error).toBe("Telegram WebApp SDK not available");

    // Restore
    Object.defineProperty(window, "Telegram", { value: origTelegram, writable: true });
  });

  it("sets connection error on network failure", async () => {
    mockAuth.mockRejectedValueOnce(new Error("Network error"));

    await useAuthStore.getState().authenticate();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
    // Error message now includes more detail
    expect(state.error).toContain("Connection error");
    expect(state.error).toContain("Network error");
  });
});
