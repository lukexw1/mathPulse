/** Telegram WebApp type declarations. */

interface SafeAreaInset {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

interface TelegramWebApp {
  ready(): void;
  expand(): void;
  close(): void;
  disableVerticalSwipes(): void;
  setHeaderColor(color: string): void;
  setBackgroundColor(color: string): void;
  /** Bot API 7.10+ Sets the bottom bar color (#RRGGBB or keyword). */
  setBottomBarColor(color: string): void;
  /** Bot API 8.0+ Opens the Mini App in fullscreen mode. */
  requestFullscreen(): void;
  /** Bot API 8.0+ Exits fullscreen mode. */
  exitFullscreen(): void;
  /** Bot API 8.0+ True if the Mini App is currently in fullscreen mode. */
  isFullscreen: boolean;
  /** Bot API 8.0+ Device safe area insets (notches, nav bars). CSS: var(--tg-safe-area-inset-*) */
  safeAreaInset: SafeAreaInset;
  /** Bot API 8.0+ Content safe area insets (Telegram UI overlap). CSS: var(--tg-content-safe-area-inset-*) */
  contentSafeAreaInset: SafeAreaInset;
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name: string;
      username?: string;
      language_code?: string;
      photo_url?: string;
    };
  };
  colorScheme: "light" | "dark";
  viewportStableHeight: number;
  isVersionAtLeast(version: string): boolean;
  HapticFeedback: {
    notificationOccurred(type: "error" | "success" | "warning"): void;
    impactOccurred(style: "light" | "medium" | "heavy"): void;
    selectionChanged(): void;
  };
  BackButton: {
    show(): void;
    hide(): void;
    onClick(callback: () => void): void;
    offClick(callback: () => void): void;
  };
  MainButton: {
    text: string;
    show(): void;
    hide(): void;
    onClick(callback: () => void): void;
    offClick(callback: () => void): void;
  };
}

interface Window {
  Telegram?: {
    WebApp?: TelegramWebApp;
  };
}
