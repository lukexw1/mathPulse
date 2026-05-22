/** ProfilePage — User stats and topic progress (FR-36). */

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "../components/Icon";
import { useAuthStore } from "../stores/authStore";
import { useProfileStore } from "../stores/profileStore";
import type { IconName } from "../components/Icon";

const TOPIC_ICONS: Record<string, IconName> = {
  algebra: "functions",
  geometry: "architecture",
  statistics: "bar_chart",
  advanced_math: "psychology",
};

export function ProfilePage() {
  const { t } = useTranslation();
  const { profile, isLoading, load } = useProfileStore();
  const authUser = useAuthStore((s) => s.user);

  const TOPIC_LABELS: Record<string, string> = {
    algebra: t("profile.topic_labels.algebra"),
    geometry: t("profile.topic_labels.geometry"),
    statistics: t("profile.topic_labels.statistics"),
    advanced_math: t("profile.topic_labels.advanced_math"),
  };

  useEffect(() => {
    load();
  }, [load]);

  if (isLoading && !profile) {
    return (
      <div className="pt-6 pt-safe pb-20 px-6 max-w-2xl mx-auto">
        <div className="flex flex-col items-center mb-10">
          <div className="skeleton w-24 h-24 rounded-full mb-4" />
          <div className="skeleton h-6 w-40 mb-2" />
          <div className="skeleton h-4 w-32" />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="col-span-2 skeleton h-40 rounded-xl" />
          <div className="skeleton h-32 rounded-xl" />
          <div className="skeleton h-32 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="pt-6 pt-safe pb-20 px-6 max-w-2xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Icon name="person_off" size={40} className="text-on-surface-variant mb-4 mx-auto" />
          <p className="text-on-surface-variant">{t("profile.failed_to_load")}</p>
        </div>
      </div>
    );
  }

  const accuracyPct = Math.round(profile.accuracy * 100);

  return (
    <div className="pt-6 pt-safe pb-20 px-6 max-w-2xl mx-auto">
      {/* Profile Header */}
      <section className="mb-8">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-primary/8 dark:bg-primary/20 blur-3xl rounded-full" aria-hidden="true" />
            <div
              className="relative w-24 h-24 rounded-full border-2 border-primary bg-surface-container-highest overflow-hidden flex items-center justify-center text-3xl font-headline font-bold text-primary"
              style={{ boxShadow: "var(--shadow-glow-lg)" }}
              aria-hidden="true"
            >
              {authUser?.photo_url ? (
                <img
                  src={authUser.photo_url}
                  alt={profile.first_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                profile.first_name[0]
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-tertiary text-on-tertiary p-1.5 rounded-full flex items-center justify-center shadow-lg">
              <Icon name="bolt" filled size={16} />
            </div>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-on-surface mb-1">
            {profile.first_name}
          </h2>
          {profile.username && (
            <p className="text-on-surface-variant text-sm">@{profile.username}</p>
          )}
          <p className="text-on-surface-variant font-medium text-sm mt-1">
            {t("profile.level", { level: profile.level })}
          </p>
        </div>
      </section>

      {/* Bento Grid Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {/* XP & Rank Card */}
        <div className="col-span-2 bento-card bg-surface-container-low p-6 rounded-xl flex flex-col justify-between relative overflow-hidden group hover:bg-surface-container-high transition-colors">
          <div className="absolute top-0 right-0 p-8 opacity-[0.04] dark:opacity-10 group-hover:opacity-[0.08] dark:group-hover:opacity-15 transition-opacity" aria-hidden="true">
            <Icon name="monitoring" size={80} />
          </div>
          <div className="z-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant mb-4">
              {t("profile.learning_progress")}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold font-headline text-on-surface leading-none tabular-nums">
                {profile.xp.toLocaleString()}
              </span>
              <span className="text-primary font-bold text-xl">XP</span>
            </div>
          </div>
          <div className="z-10 flex justify-between items-end">
            <div>
              <p className="text-xs text-on-surface-variant uppercase tracking-widest mb-1">
                {t("profile.solved_label")}
              </p>
              <p className="text-secondary font-bold text-lg tabular-nums">
                {t("profile.total_solved_count", { count: profile.total_solved })}
              </p>
            </div>
            <div
              className="h-12 w-1 bg-primary/30 rounded-full relative overflow-hidden"
              role="progressbar"
              aria-valuenow={accuracyPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t("profile.accuracy_label", { percent: accuracyPct })}
            >
              <div
                className="absolute bottom-0 left-0 w-full bg-primary"
                style={{
                  height: `${Math.min(accuracyPct, 100)}%`,
                  boxShadow: "var(--shadow-glow-sm)",
                }}
              />
            </div>
          </div>
        </div>

        {/* Accuracy Card */}
        <div className="bento-card bg-surface-container-low p-5 rounded-xl flex flex-col gap-3 hover:bg-surface-container-high transition-colors">
          <div className="flex justify-between items-start">
            <Icon name="target" className="text-primary" />
            <span className="text-xs text-on-surface-variant font-bold tracking-tighter uppercase">
              {t("profile.accuracy")}
            </span>
          </div>
          <div>
            <p className="text-3xl font-bold font-headline text-on-surface tabular-nums">{accuracyPct}%</p>
            <p className="text-xs text-on-surface-variant mt-1">{t("profile.correct")}</p>
          </div>
          <div
            className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={accuracyPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t("profile.accuracy_label", { percent: accuracyPct })}
          >
            <div
              className="h-full bg-gradient-to-r from-primary to-primary-dim"
              style={{ width: `${accuracyPct}%` }}
            />
          </div>
        </div>

        {/* Streak Card */}
        <div className="bento-card bg-surface-container-low p-5 rounded-xl flex flex-col gap-3 hover:bg-surface-container-high transition-colors">
          <div className="flex justify-between items-start">
            <Icon name="local_fire_department" className="text-error" />
            <span className="text-xs text-on-surface-variant font-bold tracking-tighter uppercase">
              {t("profile.streak")}
            </span>
          </div>
          <div>
            <p className="text-3xl font-bold font-headline text-on-surface tabular-nums">{profile.streak_days}</p>
            <p className="text-xs text-on-surface-variant mt-1">{t("profile.days_straight")}</p>
          </div>
          <div className="flex gap-1" aria-hidden="true">
            {Array.from({ length: 7 }, (_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i < (profile.streak_days === 0 ? 0 : (profile.streak_days % 7 || 7))
                    ? "bg-error"
                    : "bg-surface-container-highest"
                }`}
              />
            ))}
          </div>
        </div>
      </div>


      {/* Topic Details (FR-36: with subtopic breakdown) */}
      <section className="space-y-3">
        {Object.entries(profile.topics).map(([topic, data]) => {
          const topicPct = Math.round(data.accuracy * 100);
          const subtopics = data.subtopics ? Object.entries(data.subtopics) : [];
          return (
            <div
              key={topic}
              className="bg-surface-container-low px-5 py-4 rounded-xl border border-outline-variant/10"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center">
                  <Icon name={TOPIC_ICONS[topic] || "functions"} className="text-primary-dim" />
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">
                    {TOPIC_LABELS[topic] || topic}
                  </p>
                  <p className="text-sm font-bold tabular-nums">
                    {data.solved}/{data.total_questions} ({topicPct}%)
                  </p>
                </div>
              </div>
              {/* Subtopic breakdown */}
              {subtopics.length > 0 && (
                <div className="mt-3 ml-14 space-y-2">
                  {subtopics.map(([sub, subData]) => {
                    const subPct = Math.round(subData.accuracy * 100);
                    return (
                      <div key={sub} className="flex justify-between items-center text-xs">
                        <span className="text-on-surface-variant">
                          {t(`profile.subtopic_labels.${sub}`, sub.replace(/_/g, " "))}
                        </span>
                        <span className="text-on-surface tabular-nums">
                          {subData.solved}/{subData.total_questions} ({subPct}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
