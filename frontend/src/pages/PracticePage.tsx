/** PracticePage — Question answering flow (FR-14 through FR-18). */

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { QuestionCard, MathText } from "../components/QuestionCard";
import { SolutionView } from "../components/SolutionView";
import { Icon } from "../components/Icon";
import { haptic } from "../utils/haptic";
import { usePracticeStore } from "../stores/practiceStore";
import { useAuthStore } from "../stores/authStore";
import { useLocalizedQuestion } from "../hooks/useLocalizedQuestion";

/** FR-28: Level Up overlay modal. */
function LevelUpModal({ level, onClose }: { level: number; onClose: () => void }) {
  const { t } = useTranslation();
  useEffect(() => {
    haptic.success();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-container-low rounded-2xl p-8 text-center max-w-xs mx-6 animate-scale-in border border-primary/20">
        <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-4 relative">
          <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl animate-glow-pulse" aria-hidden="true" />
          <Icon name="arrow_upward" filled size={40} className="text-primary relative z-10" />
        </div>
        <h2 className="font-headline text-3xl font-bold text-on-surface mb-2">
          {t("practice.level_up", { level })}
        </h2>
        <p className="text-on-surface-variant text-sm mb-6">
          {t("practice.level_up_description")}
        </p>
        <button
          onClick={() => {
            haptic.light();
            onClose();
          }}
          className="w-full py-3 px-6 rounded-xl bg-primary text-on-primary font-bold text-sm transition-all active:scale-[0.97]"
          style={{ boxShadow: "var(--shadow-glow-md)" }}
        >
          {t("practice.great")}
        </button>
      </div>
    </div>
  );
}

export function PracticePage() {
  const {
    currentQuestion,
    result,
    isLoading,
    isSubmitting,
    submitError,
    selectedAnswer,
    hintVisible,
    questionNumber,
    totalQuestions,
    showSolution,
    previousLevel,
    loadNextQuestion,
    selectAnswer,
    submit,
    showHint,
    openSolution,
    closeSolution,
    setPreviousLevel,
  } = usePracticeStore();

  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const localizedQuestion = useLocalizedQuestion(currentQuestion);

  // FR-28: Level-up detection
  const [levelUpValue, setLevelUpValue] = useState<number | null>(null);

  // Set previous level from auth store on mount and when user changes
  useEffect(() => {
    if (user?.level) {
      setPreviousLevel(user.level);
    }
  }, [user?.level, setPreviousLevel]);

  // FR-28: Detect level up when result comes in
  useEffect(() => {
    if (result && result.new_level > previousLevel) {
      setLevelUpValue(result.new_level);
      setPreviousLevel(result.new_level);
    }
  }, [result, previousLevel, setPreviousLevel]);

  // FR-42: BackButton — context-aware
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg?.BackButton) {
      tg.BackButton.show();
      const handler = () => {
        if (showSolution) {
          // Go back from solution to question+result footer
          closeSolution();
        } else {
          window.history.back();
        }
      };
      tg.BackButton.onClick(handler);
      return () => {
        tg.BackButton.offClick(handler);
        tg.BackButton.hide();
      };
    }
  }, [showSolution, closeSolution]);

  // Load first question
  useEffect(() => {
    if (!currentQuestion && !isLoading) {
      loadNextQuestion();
    }
  }, [currentQuestion, isLoading, loadNextQuestion]);

  if (isLoading) {
    return (
      <div className="pt-6 pt-safe pb-20 px-6 max-w-2xl mx-auto">
        <div className="skeleton h-6 w-32 mb-4" />
        <div className="skeleton h-1 w-full mb-10" />
        <div className="skeleton h-64 mb-8 rounded-xl" />
        <div className="space-y-4">
          <div className="skeleton h-14 rounded-xl" />
          <div className="skeleton h-14 rounded-xl" />
          <div className="skeleton h-14 rounded-xl" />
          <div className="skeleton h-14 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="pt-6 pt-safe pb-20 px-6 max-w-2xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Icon name="quiz" size={40} className="text-on-surface-variant mb-4 mx-auto" />
          <p className="text-on-surface text-lg mb-4">{t("practice.no_questions_available")}</p>
          <button
            onClick={loadNextQuestion}
            className="px-6 py-3 rounded-xl bg-surface-container-highest text-on-surface-variant font-bold text-sm hover:bg-surface-bright transition-colors active:scale-[0.97]"
          >
            {t("practice.try_again")}
          </button>
        </div>
      </div>
    );
  }

  const progress = (questionNumber / totalQuestions) * 100;
  const hasResult = result != null;

  // FR-16: Show full SolutionView when user taps to see solution
  if (showSolution && result) {
    console.log('PracticePage: Rendering SolutionView with result:', result);
    return (
      <div className="pt-6 pt-safe pb-20 px-6 max-w-2xl mx-auto">
        {/* FR-28: Level Up modal */}
        {levelUpValue !== null && (
          <LevelUpModal level={levelUpValue} onClose={() => setLevelUpValue(null)} />
        )}
        <SolutionView result={result} onNext={loadNextQuestion} />
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: "var(--tg-viewport-stable-height, 100dvh)" }}>
      {/* FR-28: Level Up modal */}
      {levelUpValue !== null && (
        <LevelUpModal level={levelUpValue} onClose={() => setLevelUpValue(null)} />
      )}

      <div className="flex-1 overflow-y-auto pt-6 pt-safe px-6 max-w-2xl mx-auto w-full">
        {/* Progress Bar */}
        <div
          className="w-full h-1 bg-surface-container-highest rounded-full mb-6 overflow-hidden"
          role="progressbar"
          aria-valuenow={questionNumber}
          aria-valuemin={0}
          aria-valuemax={totalQuestions}
          aria-label={t("practice.question_of", { current: questionNumber, total: totalQuestions })}
        >
          <div
            className="h-full bg-gradient-to-r from-tertiary to-tertiary-dim transition-all duration-300"
            style={{
              width: `${Math.min(progress, 100)}%`,
              boxShadow: "var(--shadow-glow-tertiary)",
            }}
          />
        </div>

        {/* Question Bento Card */}
        <div className="bg-surface-container-low rounded-xl p-4 mb-4 border border-outline-variant/10 math-gradient relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-[0.04] dark:opacity-10" aria-hidden="true">
            <Icon name="functions" size={64} />
          </div>
          <div className="relative z-10">
            <div className="inline-block px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs uppercase font-bold tracking-widest mb-4 tabular-nums">
              {t("practice.question_number", { number: questionNumber })}
            </div>
            <QuestionCard
              question={localizedQuestion!}
              selectedAnswer={selectedAnswer}
              onSelect={selectAnswer}
              disabled={hasResult}
              correctAnswer={result?.correct_answer ?? null}
            />
          </div>
        </div>

        {/* Hint card (FR-17) — hidden once result is shown */}
        {!hasResult && hintVisible && localizedQuestion?.hint && (
          <div className="bg-tertiary-container p-4 rounded-xl border border-tertiary/20 flex gap-3 items-center mb-6">
            <div className="bg-tertiary/15 p-2 rounded-lg">
              <Icon name="lightbulb" className="text-tertiary-dim" />
            </div>
            <p className="text-sm text-on-surface leading-snug">
              <strong className="text-tertiary">{t("practice.hint")}:</strong>{" "}
              <MathText text={localizedQuestion.hint} />
            </p>
          </div>
        )}
      </div>

      {/* Footer — switches between Submit and Result feedback */}
      <footer className="shrink-0 w-full bg-surface/95 backdrop-blur-xl px-6 py-4 pb-safe border-t border-outline-variant/20">
        {hasResult ? (
          /* ===== Result feedback mini-card ===== */
          <div
            className={`max-w-2xl mx-auto flex items-center gap-4 p-3 rounded-xl ${
              result.is_correct
                ? "bg-tertiary-container border border-tertiary/30"
                : "bg-error-container border border-error/30"
            }`}
          >
            {/* Icon */}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                result.is_correct ? "bg-tertiary/15" : "bg-error/15"
              }`}
            >
              <Icon
                name={result.is_correct ? "check_circle" : "cancel"}
                filled
                size={24}
                className={result.is_correct ? "text-tertiary" : "text-error"}
              />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p
                className={`font-headline font-bold text-sm ${
                  result.is_correct ? "text-tertiary" : "text-error"
                }`}
              >
                {result.is_correct ? t("practice.correct") : t("practice.wrong")}
              </p>
              <p className="text-xs text-on-surface-variant truncate">
                {result.is_correct
                  ? result.xp_earned > 0
                    ? t("practice.xp_earned", { xp: result.xp_earned })
                    : t("practice.perfect")
                  : t("practice.answer_correct", { answer: result.correct_answer })}
              </p>
            </div>

            {/* FR-16: Solution button — opens full SolutionView */}
            <button
              onClick={() => {
                haptic.light();
                openSolution();
              }}
              className="shrink-0 flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-surface-container-highest text-on-surface-variant font-headline font-bold text-xs uppercase tracking-wider transition-all active:scale-[0.97]"
              aria-label={t("practice.show_solution")}
            >
              <Icon name="lightbulb" size={18} />
              {t("practice.solution")}
            </button>

            {/* Next button */}
            <button
              onClick={() => {
                haptic.light();
                loadNextQuestion();
              }}
              className="shrink-0 flex items-center gap-2 h-10 px-5 rounded-xl bg-primary text-on-primary font-headline font-bold text-sm transition-all active:scale-[0.97]"
              style={{ boxShadow: "var(--shadow-glow-sm)" }}
            >
              {t("practice.next")}
              <Icon name="chevron_right" size={18} />
            </button>
          </div>
        ) : (
          /* ===== Submit / Hint bar ===== */
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-4 bg-surface-container-highest/60 rounded-xl p-2">
              {/* Hint Button */}
              {localizedQuestion?.hint && !hintVisible && (
                <button
                  onClick={() => {
                    haptic.light();
                    showHint();
                  }}
                  aria-label={t("practice.hint_button")}
                  className="flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-surface-container-highest text-on-surface-variant font-headline font-bold tracking-widest uppercase text-xs hover:bg-surface-bright transition-colors active:scale-[0.97]"
                >
                  <Icon name="lightbulb" size={18} />
                  {t("practice.hint_button")}
                </button>
              )}

              {/* Submit Button */}
              <button
                onClick={() => {
                  haptic.light();
                  submit();
                }}
                disabled={!selectedAnswer || isSubmitting}
                className={`flex-[2] flex items-center justify-center h-10 px-6 rounded-lg font-headline font-bold tracking-widest uppercase text-sm transition-all active:scale-[0.97] ${
                  isSubmitting
                    ? "bg-primary/50 text-on-primary cursor-wait"
                    : selectedAnswer
                      ? "bg-gradient-to-br from-primary to-primary-dim text-on-primary hover:scale-[1.02]"
                      : "bg-surface-container-highest text-on-surface-variant/60 cursor-not-allowed"
                }`}
                style={selectedAnswer && !isSubmitting ? { boxShadow: "var(--shadow-glow-md)" } : undefined}
              >
                {isSubmitting ? t("practice.checking") : t("practice.submit")}
              </button>
            </div>
            {submitError && (
              <p className="text-error text-xs text-center mt-2">{submitError}</p>
            )}
          </div>
        )}
      </footer>
    </div>
  );
}
