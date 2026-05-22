/** Dashboard store — cached dashboard data with stale-while-revalidate. */

import { create } from "zustand";
import { fetchDashboard } from "../functions/client";
import type { DashboardData } from "../types";

/** How long cached data is considered fresh (ms). */
const STALE_AFTER_MS = 60_000; // 1 minute

interface DashboardState {
  dashboard: DashboardData | null;
  isLoading: boolean;
  error: boolean;
  lastFetchedAt: number;

  /** Load dashboard — shows cached data instantly, refreshes in background if stale. */
  load: () => Promise<void>;
  /** Force a full reload (for retry button). */
  forceRefresh: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  dashboard: null,
  isLoading: false,
  error: false,
  lastFetchedAt: 0,

  load: async () => {
    const { dashboard, lastFetchedAt, isLoading } = get();

    // Already loading — skip duplicate request
    if (isLoading) return;

    const isFresh = dashboard && Date.now() - lastFetchedAt < STALE_AFTER_MS;

    if (isFresh) {
      // Data is fresh — no fetch needed
      return;
    }

    if (dashboard) {
      // Stale data exists — show it, refresh in background (no loading spinner)
      fetchDashboard().then((res) => {
        if (res.data) {
          set({ dashboard: res.data, lastFetchedAt: Date.now(), error: false });
        }
      });
      return;
    }

    // No cached data — show loading spinner
    set({ isLoading: true, error: false });
    try {
      const res = await fetchDashboard();
      if (res.data) {
        set({ dashboard: res.data, isLoading: false, lastFetchedAt: Date.now(), error: false });
      } else {
        set({ isLoading: false, error: true });
      }
    } catch {
      set({ isLoading: false, error: true });
    }
  },

  forceRefresh: async () => {
    set({ isLoading: true, error: false });
    try {
      const res = await fetchDashboard();
      if (res.data) {
        set({ dashboard: res.data, isLoading: false, lastFetchedAt: Date.now(), error: false });
      } else {
        set({ isLoading: false, error: true });
      }
    } catch {
      set({ isLoading: false, error: true });
    }
  },
}));
