/** SolutionView — shows step-by-step solution after answering (FR-16). */

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { AnswerResult } from "../types";
import { MathText, FormulaBlock } from "./QuestionCard";
import { Icon } from "./Icon";
import { haptic } from "../utils/haptic";

interface SolutionViewProps {
  result: AnswerResult;
  onNext: () => void;
}

export function SolutionView({ result, onNext }: SolutionViewProps) {
  const { t, i18n } = useTranslation();
  
  // Get solution_steps from i18n using question_key
  const solutionSteps = result.question_key 
    ? (t(`questions:${result.question_key}.solution_steps`, { returnObjects: true, defaultValue: result.solution_steps }) as AnswerResult["solution_steps"])
    : result.solution_steps; // Fallback to backend data if no question_key
  
  // Debug logging
  console.log('SolutionView debug:', {
    question_key: result.question_key,
    backend_steps: result.solution_steps,
    i18n_steps: solutionSteps,
    current_lang: i18n.language,
  });
  
  // Haptic feedback on result display
  useEffect(() => {
    if (result.is_correct) {
      haptic.success();
    } else {
      haptic.error();
    }
  }, [result.is_correct]);

  return (
    <div className="min-h-screen">
      {/* Feedback Section */}
      <section className="mb-8 text-center" aria-live="polite">
        <div className="inline-flex flex-col items-center">
          {/* Glowing Badge */}
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 relative ${
            result.is_correct ? "bg-tertiary-container" : "bg-error-container"
          }`}>
            <div
              className={`absolute inset-0 rounded-full blur-xl ${
                result.is_correct ? "bg-tertiary/15" : "bg-error/15"
              }`}
              aria-hidden="true"
            />
            <Icon
              name={result.is_correct ? "check_circle" : "cancel"}
              filled
              size={40}
              className={`relative z-10 ${
                result.is_correct ? "text-tertiary-dim" : "text-error"
              }`}
            />
          </div>
          <h1 className="font-headline text-4xl font-bold tracking-tight text-on-surface">
            {result.is_correct ? t("solution.correct") : t("solution.wrong")}
          </h1>
          <p className="text-on-surface-variant mt-2 text-sm uppercase tracking-widest font-bold tabular-nums">
            {result.xp_earned > 0 && `+${result.xp_earned} XP`}
          </p>
          {!result.is_correct && (
            <p className="text-on-surface-variant mt-2 text-sm">
              <MathText text={t("solution.correct_answer", { answer: result.correct_answer })} />
            </p>
          )}
        </div>
      </section>

      {/* Solution Steps Block */}
      <div className="space-y-4">
        <h2 className="font-headline text-2xl font-bold text-on-surface ml-2">
          {t("solution.steps_title")}
        </h2>

        {solutionSteps.map((step) => (
          <div
            key={step.step}
            className="bg-surface-container-low p-6 rounded-xl border-l-4 border-primary/30"
          >
            <div className="flex items-start gap-4">
              <span className="font-headline text-primary-dim font-bold text-lg opacity-70 tabular-nums">
                {String(step.step).padStart(2, "0")}
              </span>
              <div className="flex-1">
                <p className="text-on-surface-variant leading-relaxed">
                  <MathText text={step.text} />
                </p>
                {step.formula && (
                  <div className="bg-surface-container-high p-4 rounded-lg text-center text-primary-dim mt-3">
                    <FormulaBlock latex={step.formula} />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Actions */}
      <div className="mt-8 flex gap-4">
        <button
          onClick={() => {
            haptic.light();
            onNext();
          }}
          className="flex-1 py-4 px-6 rounded-xl bg-primary text-on-primary font-bold text-sm transition-all active:scale-[0.97] hover:brightness-110"
          style={{ boxShadow: "var(--shadow-glow-md)" }}
        >
          {t("solution.next_question")}
        </button>
      </div>
    </div>
  );
}