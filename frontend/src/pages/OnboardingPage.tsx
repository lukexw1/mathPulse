/** OnboardingPage — Welcome screen → set goal → enter app (no mini-test). */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { setGoal } from "../functions/client";
import { Icon } from "../components/Icon";
import { haptic } from "../utils/haptic";
import { useAuthStore } from "../stores/authStore";

type Step = "welcome" | "preparing" | "result";

export function OnboardingPage() {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>("welcome");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { authenticate } = useAuthStore();

  // Welcome → set goal → immediately enter the app (skip mini-test)
  const handleWelcomeStart = async () => {
    haptic.light();
    setIsSubmitting(true);
    setStep("preparing");
    try {
      await setGoal("sat");
      // Skip the mini-test entirely — just set the goal and enter the app
      setStep("result");
      haptic.success();
    } catch {
      // If setting goal fails, still let user enter the app
      setStep("result");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 0: Welcome screen
  if (step === "welcome") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 pt-safe pb-safe animate-page-enter">
        <div className="max-w-md w-full text-center">
          {/* Logo / brand */}
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 relative">
            <div className="absolute inset-0 rounded-2xl bg-primary/12 blur-xl" aria-hidden="true" />
            <Icon name="bolt" filled size={40} className="text-primary relative z-10" />
          </div>

          <h1 className="font-headline text-3xl font-bold text-on-surface lowercase tracking-tight mb-4">
            mathpulse
          </h1>

          <p className="text-on-surface-variant text-sm leading-relaxed mb-8 max-w-xs mx-auto">
            {t("onboarding.welcome_subtitle")}
          </p>

          <button
            onClick={handleWelcomeStart}
            disabled={isSubmitting}
            className="w-full py-4 px-8 rounded-xl bg-gradient-to-br from-primary to-primary-dim text-on-primary font-headline font-bold text-sm hover:scale-[1.02] active:scale-[0.97] transition-all disabled:opacity-60"
            style={{ boxShadow: "var(--shadow-glow-md)" }}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-on-primary border-t-transparent" />
                {t("onboarding.welcome_preparing")}
              </span>
            ) : (
              t("onboarding.welcome_start")
            )}
          </button>
        </div>
      </div>
    );
  }

  // Step 1: Preparing (brief spinner while setting goal)
  if (step === "preparing") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 pt-safe pb-safe animate-page-enter">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <span className="animate-spin rounded-full h-8 w-8 border-3 border-primary border-t-transparent" />
          </div>
          <p className="text-on-surface-variant text-sm mt-4">
            {t("onboarding.welcome_preparing")}
          </p>
        </div>
      </div>
    );
  }

  // Step 2: Ready to enter the app
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 pt-safe pb-safe animate-page-enter">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-tertiary-container flex items-center justify-center mx-auto mb-6 relative">
          <div className="absolute inset-0 rounded-full bg-tertiary/12 blur-xl" aria-hidden="true" />
          <Icon name="celebration" filled size={40} className="text-tertiary-dim relative z-10" />
        </div>

        <h2 className="font-headline text-2xl font-bold text-on-surface mb-2">
          {t("onboarding.welcome_title")}
        </h2>
        <p className="text-on-surface-variant text-sm mb-8">
          {t("onboarding.ready_to_start")}
        </p>

        <button
          onClick={() => authenticate()}
          className="w-full py-4 px-8 rounded-xl bg-gradient-to-br from-primary to-primary-dim text-on-primary font-headline font-bold text-sm hover:scale-[1.02] active:scale-[0.97] transition-all"
          style={{ boxShadow: "var(--shadow-glow-md)" }}
        >
          {t("onboarding.start_practice")}
        </button>
      </div>
    </div>
  );
}