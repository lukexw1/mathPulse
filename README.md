# 🧠 MathPulse — SAT Math Prep. Telegram Mini App

> **An interactive platform for SAT Math preparation.**  
> Boosts student scores through adaptive learning, gamification, and spaced repetition — all inside Telegram.

---

## 🌐 Live Demo

**[@mathpulse_bot](https://t.me/mathPulse_bot/MathPulse)** — open the bot and tap *"Launch"*.

> *Your demo link:* `https://t.me/mathPulse_bot/MathPulse`

---

## ✨ Key Features

| 🚀 | Instant Response | Async data & question prefetching — zero loading states between screens |
|---|---|---|
| 🎯 | Adaptive Learning | Smart question selection based on student level + SM-2 spaced repetition for maximum retention |
| 🧩 | Complete Learning Loop | Theory → Quiz → Practice → Review. A closed cycle with no progress loss |
| 📱 | Telegram Mini App | Deep Telegram integration: seamless auth, haptic feedback, BackButton, Telegram Stars monetization |
| 🌍 | Multi-language | English, Russian — dynamic language switching without page reload |

---

## 🛠 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript 5.9, Vite 8, React Router 7, Zustand (state management), Tailwind CSS, i18next |
| **Backend** | Python 3.11, FastAPI, Pydantic v2, Uvicorn |
| **Database** | Supabase (PostgreSQL + Auth + Storage) |
| **Infrastructure** | Cloudflare Pages (frontend), Render (backend), Better Stack (monitoring) |
| **Tooling** | Ruff (linter), Pytest (tests), python-dotenv |

### Why This Stack = Quality You Can Trust

- **FastAPI + async** — non-blocking I/O on every endpoint, handles high concurrency out of the box
- **React + Zustand** — minimal re-renders, client-side caching, aggressive prefetching
- **Supabase** — managed PostgreSQL with built-in auth, real-time capabilities, and row-level security
- **TypeScript** — static typing eliminates entire categories of production bugs
- **pytest + ruff** — automated testing and linting enforced in CI

---

## 🔍 Architecture Highlights

### ⚡ Global Prefetching
On auth, all tab data (dashboard, profile, theory, practice) is prefetched in a single background wave. The user navigates instantly — zero spinners, zero skeletons.

### 🧠 SM-2 Spaced Repetition
Wrong answers are automatically rescheduled for review at optimal intervals (1, 6, 16, 45 days…). Based on the SM-2 algorithm (SuperMemo), adapted for SAT format.

### 🔄 Background Queue Refill
Questions are fetched in batches of 12. When 3 questions remain, the next batch is silently fetched in the background. The user never waits between questions.

### 🌐 Production-grade i18n
Two languages (EN/RU) with isolated JSON translation files. Supports placeholders, plurals (i18next), and locale-aware date formatting.

---

## 📁 Project Structure

```
mathPulse/
├── backend/
│   ├── app/
│   │   ├── api/          # Routes: auth, questions, theory, profile, review…
│   │   ├── core/         # Config, middleware, Supabase client
│   │   └── services/     # SM-2 algorithm, business logic
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── components/   # UI components (TabBar, QuestionCard, ProgressBar…)
│   │   ├── pages/        # Home, Practice, Theory, Calculator, Profile, Onboarding
│   │   ├── stores/       # Zustand stores: auth, dashboard, practice, theory, profile
│   │   ├── locales/      # i18n: en, ru, uz
│   │   └── functions/    # Typed API client
│   └── public/
└── theory/               # Theory articles with LaTeX
```

---

## 📊 Target Audience

- **Students 16–18** — preparing for SAT, WIUT, or local math exams
- **Tutors** — track student progress with detailed analytics
- **EdTech startups** — ready-to-launch educational Telegram Mini App

---

## 🤝 Let's Work Together

Open for new projects.  
Reach out on Telegram: **[@lukexwd](https://t.me/lukexwd)**

[![Telegram](https://img.shields.io/badge/Telegram-@lukexwd-26A5E4?logo=telegram&logoColor=white)](https://t.me/lukexwd)

---

<p align="center">
  <sub>Built with React, FastAPI & ❤️ — SAT Math, accelerated.</sub>
</p>