/** XP progress bar component — mobile XP display. */

import { useTranslation } from "react-i18next";

interface XpBarProps {
  xp: number;
  level: number;
  xpToNextLevel: number;
}

export function XpBar({ xp, level, xpToNextLevel }: XpBarProps) {
  const { t } = useTranslation();
  const xpInCurrentLevel = 500 - xpToNextLevel;
  const pct = (xpInCurrentLevel / 500) * 100;
  const totalXp = xp;

  return (
    <div className="mb-8">
      <div className="flex justify-between items-end mb-2">
        <h2 className="text-sm font-label font-medium text-on-surface-variant">
          {t("common.level", { level })}
        </h2>
        <span className="text-xs font-label text-primary tabular-nums">
          {t("common.xp_progress", { current: xpInCurrentLevel, max: 500 })}
        </span>
      </div>
      <div
        className="w-full h-2 bg-surface-container-low rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t("common.level_progress_label", { percent: Math.round(pct) })}
      >
        <div
          className="h-full bg-gradient-to-r from-tertiary to-tertiary-dim transition-all duration-500"
          style={{
            width: `${pct}%`,
            boxShadow: "var(--shadow-glow-tertiary)",
          }}
        />
      </div>
      <p className="text-xs text-on-surface-variant mt-1 text-right tabular-nums">
        {t("common.total_xp", { total: totalXp })}
      </p>
    </div>
  );
}
