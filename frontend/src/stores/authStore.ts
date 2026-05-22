/** Auth store — Telegram authentication state. */

import { create } from "zustand";
import { authenticateTelegram } from "../functions/client";
import type { UserProfile } from "../types";

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  authenticate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  authenticate: async () => {
    const tg = window.Telegram?.WebApp;
    const initData = tg?.initData;

    if (!initData) {
      const reason = !tg
        ? "Telegram WebApp SDK not available"
        : "initData is empty (app not opened via Telegram button)";
      set({ isLoading: false, error: reason });
      return;
    }

    try {
      const response = await authenticateTelegram(initData);
      if (response.error) {
        set({ isLoading: false, error: `Auth failed: ${response.error}` });
        return;
      }

      // Grab photo_url from Telegram's client-side data (not in backend response)
      const photoUrl = tg.initDataUnsafe?.user?.photo_url ?? null;
      const profile = response.data as UserProfile;

      set({
        user: { ...profile, photo_url: profile.photo_url ?? photoUrl },
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
      set({ isLoading: false, error: `Connection error: ${msg} [API: ${apiUrl}]` });
    }
  },
}));
