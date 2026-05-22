/** TopicProgressList — shows solved/total per topic on dashboard (FR-33, FR-34). */

import { useTranslation } from "react-i18next";
import type { TopicProgress } from "../types";

const TOPIC_COLORS: Record<string, string> = {
  algebra: "bg-primary",
  geometry: "bg-secondary",
  statistics: "bg-tertiary",
  advanced_math: "bg-error",
};

interface TopicProgressBarProps {
  topics: TopicProgress[];
}

export function TopicProgressList({ topics }: TopicProgressBarProps) {
  const { t } = useTranslation();
  return (
    <div className="bento-card bg-surface-container-low rounded-xl p-6">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-xl font-headline font-semibold">{t("topic_progress.title")}</h3>
        <span className="text-xs font-label text-primary-dim uppercase tracking-widest">
          {t("topic_progress.analytics")}
        </span>
      </div>
      <div className="space-y-6">
        {topics.map((topic) => {
          const pct = Math.round(topic.accuracy * 100);
          const label = t(`profile.topic_labels.${topic.topic}`, { defaultValue: topic.topic.replace("_", " ") });
          return (
            <div key={topic.topic}>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-on-surface-variant">
                  {label}
                </span>
                <span className="text-on-surface tabular-nums">
                  {topic.solved}/{topic.total_questions}
                </span>
              </div>
              <div
                className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${label}: ${pct}%`}
              >
                <div
                  className={`h-full ${TOPIC_COLORS[topic.topic] || "bg-primary"} transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
