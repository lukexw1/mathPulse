/** Theme store — light/dark mode toggle with localStorage persistence. */

import { create } from "zustand";

type Theme = "light" | "dark";

const STORAGE_KEY = "mathpulse-theme";

const TELEGRAM_COLORS: Record<Theme, string> = {
  light: "#e5e5e5",
  dark: "#0e0e0e",
};

/** Read saved theme from localStorage (defaults to "light"). */
function getSavedTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // localStorage unavailable (e.g. in tests)
  }
  return "dark";
}

/** Apply theme to DOM and Telegram WebApp. */
function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;

  const tg = window.Telegram?.WebApp;
  if (tg) {
    const color = TELEGRAM_COLORS[theme];
    tg.setHeaderColor(color);
    tg.setBackgroundColor(color);
    if (tg.isVersionAtLeast("7.10")) {
      tg.setBottomBarColor(color);
    }
  }
}

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: getSavedTheme(),

  toggleTheme: () => {
    const next = get().theme === "light" ? "dark" : "light";
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage unavailable
    }
    applyTheme(next);
    set({ theme: next });
  },
}));

/** Call once on app startup to sync DOM with stored preference. */
export function initTheme(): void {
  const theme = useThemeStore.getState().theme;
  applyTheme(theme);
}
