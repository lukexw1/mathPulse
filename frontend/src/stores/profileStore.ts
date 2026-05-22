/** Profile store — cached profile data with stale-while-revalidate. */

import { create } from "zustand";
import { fetchProfile } from "../functions/client";
import type { ProfileData } from "../types";

/** How long cached data is considered fresh (ms). */
const STALE_AFTER_MS = 60_000; // 1 minute

interface ProfileState {
  profile: ProfileData | null;
  isLoading: boolean;
  lastFetchedAt: number;

  /** Load profile — shows cached data instantly, refreshes in background if stale. */
  load: () => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  isLoading: false,
  lastFetchedAt: 0,

  load: async () => {
    const { profile, lastFetchedAt, isLoading } = get();

    // Already loading — skip duplicate request
    if (isLoading) return;

    const isFresh = profile && Date.now() - lastFetchedAt < STALE_AFTER_MS;

    if (isFresh) {
      // Data is fresh — no fetch needed
      return;
    }

    if (profile) {
      // Stale data exists — show it, refresh in background (no loading spinner)
      fetchProfile().then((res) => {
        if (res.data) {
          set({ profile: res.data as ProfileData, lastFetchedAt: Date.now() });
        }
      });
      return;
    }

    // No cached data — show loading spinner
    set({ isLoading: true });
    try {
      const res = await fetchProfile();
      if (res.data) {
        set({ profile: res.data as ProfileData, isLoading: false, lastFetchedAt: Date.now() });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
