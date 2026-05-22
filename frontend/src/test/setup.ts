/** Test setup — configures jsdom, testing-library matchers, and Telegram mock. */

import "@testing-library/jest-dom/vitest";

// Mock Telegram WebApp globally for all tests
const mockHapticFeedback = {
  notificationOccurred: vi.fn(),
  impactOccurred: vi.fn(),
  selectionChanged: vi.fn(),
};

const mockBackButton = {
  show: vi.fn(),
  hide: vi.fn(),
  onClick: vi.fn(),
  offClick: vi.fn(),
};

const mockMainButton = {
  text: "",
  show: vi.fn(),
  hide: vi.fn(),
  onClick: vi.fn(),
  offClick: vi.fn(),
};

const mockTelegramWebApp = {
  ready: vi.fn(),
  expand: vi.fn(),
  close: vi.fn(),
  disableVerticalSwipes: vi.fn(),
  initData: "mock_init_data",
  initDataUnsafe: {
    user: {
      id: 123456,
      first_name: "Test",
      username: "testuser",
      language_code: "ru",
    },
  },
  colorScheme: "light" as const,
  viewportStableHeight: 600,
  HapticFeedback: mockHapticFeedback,
  BackButton: mockBackButton,
  MainButton: mockMainButton,
};

Object.defineProperty(window, "Telegram", {
  value: { WebApp: mockTelegramWebApp },
  writable: true,
});

// Reset all mocks between tests
afterEach(() => {
  vi.restoreAllMocks();
});
