import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { initTheme } from "./stores/themeStore";
import "./i18n";
import "./index.css";

// Import KaTeX CSS (bundled fonts)
import "katex/dist/katex.min.css";

// FR-38: Call Telegram.WebApp.ready() ASAP
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
  tg.disableVerticalSwipes();

  // Bot API 8.0+ — enter fullscreen to remove header + bottom bar entirely
  if (tg.isVersionAtLeast("8.0")) {
    tg.requestFullscreen();
  }
}

// Restore saved theme (sets data-theme attribute + Telegram colors)
initTheme();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
