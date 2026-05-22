/**
 * Haptic feedback helper for Telegram WebApp.
 * Calls native haptic feedback when available, no-ops otherwise.
 */
export const haptic = {
  /** Light impact — button presses, selections */
  light: () => window.Telegram?.WebApp?.HapticFeedback?.impactOccurred("light"),

  /** Medium impact — significant actions */
  medium: () => window.Telegram?.WebApp?.HapticFeedback?.impactOccurred("medium"),

  /** Success notification — correct answers, achievements */
  success: () =>
    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred("success"),

  /** Error notification — wrong answers, validation errors */
  error: () =>
    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred("error"),
};
