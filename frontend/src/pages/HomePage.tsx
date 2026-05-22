/** HomePage — Dashboard / Home Screen (FR-33, FR-34, FR-35). */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDashboardStore } from "../stores/dashboardStore";
import { useTheoryStore } from "../stores/theoryStore";
import { useThemeStore } from "../stores/themeStore";
import { XpBar } from "../components/XpBar";
import { TopicProgressList } from "../components/TopicProgress";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { Icon } from "../components/Icon";

export function HomePage() {
  const { t } = useTranslation();
  const { dashboard, isLoading, error, load, forceRefresh } = useDashboardStore();
  const { loadArticle } = useTheoryStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  useEffect(() => {
    load();
  }, [load]);

  if (isLoading && !dashboard) {
    return (
      <div className="pt-6 pt-safe pb-20 px-6 max-w-5xl mx-auto">
        <div className="skeleton h-8 w-48 mb-8" />
        <div className="skeleton h-10 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8 skeleton h-64" />
          <div className="md:col-span-4 skeleton h-64" />
          <div className="md:col-span-5 skeleton h-48" />
          <div className="md:col-span-7 skeleton h-48" />
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="pt-6 pt-safe pb-20 px-6 max-w-5xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Icon name="cloud_off" size={40} className="text-on-surface-variant mb-4 mx-auto" />
          <p className="text-on-surface-variant">{t("home.failed_to_load")}</p>
          <button
            onClick={forceRefresh}
            className="mt-4 px-6 py-3 rounded-xl bg-surface-container-low text-primary font-bold text-sm hover:bg-surface-container-high transition-colors active:scale-[0.97]"
          >
            {t("home.retry")}
          </button>
        </div>
      </div>
    );
  }

  // Calculate streak dots (show last 7 days, filled for streak)
  const activeDots = dashboard.streak_days === 0 ? 0 : (dashboard.streak_days % 7 || 7);
  const streakDots = Array.from({ length: 7 }, (_, i) => i < activeDots);

  return (
    <div className="pt-6 pt-safe pb-20 px-6 max-w-5xl mx-auto">
      {/* Top bar: Theme Toggle + Language Switcher */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={toggleTheme}
          aria-label={theme === "light" ? t("home.theme_toggle_light") : t("home.theme_toggle_dark")}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-surface-container-low text-on-surface-variant hover:bg-surface-container transition-colors active:scale-[0.95]"
        >
          <Icon name={theme === "light" ? "dark_mode" : "light_mode"} size={20} filled />
        </button>
        <LanguageSwitcher />
      </div>

      {/* XP Progress Mobile */}
      <div className="md:hidden">
        <XpBar
          xp={dashboard.xp}
          level={dashboard.level}
          xpToNextLevel={dashboard.xp_to_next_level}
        />
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* CTA Card: Start Practice */}
        <button
          onClick={() => navigate("/practice")}
          className="md:col-span-8 bg-surface-container-low rounded-xl p-6 border border-outline-variant/10 relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-transform duration-200 text-left animate-card-enter"
        >
          <div
            className="absolute top-0 right-0 w-64 h-64 bg-primary/6 dark:bg-primary/15 blur-[80px] -mr-20 -mt-20 group-hover:bg-primary/12 dark:group-hover:bg-primary/25 transition-colors"
            aria-hidden="true"
          />
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-label uppercase tracking-widest mb-4">
                {t("home.recommended")}
              </span>
              <h3 className="text-2xl sm:text-3xl font-headline font-bold leading-tight">
                {t("home.start_practice")}
              </h3>
              <p className="text-on-surface-variant mt-4 max-w-sm">
                {t("home.practice_description")}
              </p>
            </div>
            <div className="mt-6 flex items-center gap-4">
              <span
                className="bg-primary text-on-primary px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all"
                style={{ boxShadow: "var(--shadow-glow-md)" }}
                aria-hidden="true"
              >
                {t("home.launch")}
                <Icon name="bolt" size={18} />
              </span>
            </div>
          </div>
        </button>

        {/* Daily Streak */}
        <div
          className="md:col-span-4 bento-card bg-surface-container-low rounded-xl p-6 flex flex-col justify-center items-center text-center animate-card-enter"
          style={{ animationDelay: "80ms" }}
        >
          <div className="w-20 h-20 bg-error-container rounded-full flex items-center justify-center mb-4 relative">
            <Icon name="local_fire_department" filled size={36} className="text-error" />
            <div className="absolute inset-0 bg-error/8 blur-xl rounded-full" aria-hidden="true" />
          </div>
          <h4 className="text-3xl font-headline font-bold tabular-nums">{dashboard.streak_days}</h4>
          <p className="text-on-surface-variant font-label uppercase tracking-widest text-xs mt-1">
            {t("home.daily_streak")}
          </p>
          <div className="flex gap-2 mt-6" aria-label={`${t("home.daily_streak")}: ${dashboard.streak_days}`}>
            {streakDots.map((active, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  active ? "bg-error" : "bg-surface-container-highest"
                }`}
                aria-hidden="true"
              />
            ))}
          </div>
          <p className="text-xs text-on-surface-variant mt-3 tabular-nums">
            {t("home.record", { record: dashboard.streak_record })}
          </p>
        </div>

        {/* Learn New Topic Block */}
        <div
          className="md:col-span-5 bento-card bg-surface-container-low rounded-xl p-6 animate-card-enter"
          style={{ animationDelay: "160ms" }}
        >
          <div className="mb-8">
            <h3 className="text-xl font-headline font-semibold">{t("home.learn_new_topic")}</h3>
          </div>
          {dashboard.next_unlearned_topic ? (
            <button
              onClick={async () => {
                // Load the article first, then navigate
                await loadArticle(dashboard.next_unlearned_topic!.subtopic);
                navigate('/theory');
              }}
              className="w-full flex items-center gap-4 p-4 bg-surface-container-high rounded-xl hover:bg-surface-bright transition-colors cursor-pointer group text-left"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Icon name="school" size={24} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{t(`theory:${dashboard.next_unlearned_topic!.subtopic}.title`, { defaultValue: dashboard.next_unlearned_topic!.title })}</p>
                <p className="text-xs text-on-surface-variant uppercase tabular-nums">
                  {t("home.min_read", { minutes: dashboard.next_unlearned_topic!.estimated_minutes })}
                </p>
              </div>
              <Icon name="chevron_right" className="text-on-surface-variant group-hover:text-primary transition-colors" />
            </button>
          ) : (
            <div className="flex items-center gap-4 p-4 bg-surface-container-high/50 rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary-dim">
                <Icon name="check_circle" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-on-surface-variant">{t("home.all_topics_learned")}</p>
                <p className="text-xs text-on-surface-variant uppercase">
                  {t("home.great_job")}
                </p>
              </div>
            </div>
          )}
          <div className="mt-4 text-center">
            <p className="text-xs text-on-surface-variant uppercase tracking-widest tabular-nums">
              {t("home.total_solved", { count: dashboard.total_solved })}
            </p>
          </div>
        </div>

        {/* Topics Progress */}
        <div
          className="md:col-span-7 animate-card-enter"
          style={{ animationDelay: "240ms" }}
        >
          <TopicProgressList topics={dashboard.topics} />
        </div>
      </div>
    </div>
  );
}
