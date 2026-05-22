/** QuestionCard — renders a question with LaTeX support (FR-14, FR-15). */

import { useTranslation } from "react-i18next";
import katex from "katex";
import "katex/dist/katex.min.css";
import type { Question } from "../types";
import { Icon } from "./Icon";
import { haptic } from "../utils/haptic";

/** Format subtopic for display */
function formatSubtopic(subtopic: string): string {
  return subtopic
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

interface QuestionCardProps {
  question: Question;
  selectedAnswer: string | null;
  onSelect: (answer: string) => void;
  disabled: boolean;
  /** The correct answer label (e.g. "B") — shown after submission */
  correctAnswer?: string | null;
}

export function QuestionCard({
  question,
  selectedAnswer,
  onSelect,
  disabled,
  correctAnswer,
}: QuestionCardProps) {
  const { t } = useTranslation();
  const handleSelect = (answer: string) => {
    haptic.light();
    onSelect(answer);
  };

  const showResult = correctAnswer != null;

  return (
    <div>
      {/* Subtopic tag */}
      <div className="mb-4">
        <span 
          className="inline-block px-3 py-1 rounded-full text-xs font-medium"
          style={{ backgroundColor: '#FFBF40', color: '#000000' }}
        >
          #{t(`profile.subtopic_labels.${question.subtopic}`, { defaultValue: formatSubtopic(question.subtopic) })}
        </span>
      </div>

      {/* Question stem */}
      <div className="font-body text-base sm:text-xl md:text-2xl font-light leading-relaxed mb-6 text-on-surface break-words whitespace-normal min-w-0">
        <MathText text={question.stem || "_loading_"} />
      </div>

      {/* Multiple choice options (FR-15a) */}
      {question.question_type === "multiple_choice" && question.choices && question.choices.length > 0 && (
        <div className="space-y-3" role="radiogroup" aria-label="Варианты ответа">
          {question.choices.map((choice) => {
            const isSelected = selectedAnswer === choice.label;
            const isCorrectOption = showResult && choice.label === correctAnswer;
            const isWrongSelected = showResult && isSelected && choice.label !== correctAnswer;

            // Determine styling based on result state
            let optionClasses: string;
            let badgeClasses: string;
            let textClasses: string;
            let trailingIcon: React.ReactNode = null;

            if (isCorrectOption) {
              // Correct answer — green highlight
              optionClasses =
                "bg-tertiary-container border border-tertiary/60";
              badgeClasses = "bg-tertiary text-on-tertiary";
              textClasses = "text-on-surface";
              trailingIcon = (
                <Icon name="check_circle" filled size={20} className="text-tertiary" />
              );
            } else if (isWrongSelected) {
              // Wrong selected answer — red highlight
              optionClasses =
                "bg-error-container border border-error/60";
              badgeClasses = "bg-error text-on-error";
              textClasses = "text-on-surface";
              trailingIcon = (
                <Icon name="cancel" filled size={20} className="text-error" />
              );
            } else if (showResult) {
              // Other options during result — dimmed
              optionClasses =
                "bg-surface-container border border-outline-variant/20 opacity-50";
              badgeClasses = "bg-surface-container-high text-on-surface-variant";
              textClasses = "text-on-surface-variant";
            } else if (isSelected) {
              // Selected before submit — primary highlight
              optionClasses =
                "bg-surface-container border border-primary/60 neon-glow-primary";
              badgeClasses = "bg-primary text-on-primary";
              textClasses = "text-on-surface";
              trailingIcon = (
                <Icon name="check_circle" filled size={20} className="text-primary" />
              );
            } else {
              // Default unselected
              optionClasses =
                "bg-surface-container border border-outline-variant/30 hover:border-primary/40 hover:bg-surface-container-high";
              badgeClasses =
                "bg-surface-container-high text-on-surface-variant group-hover:text-primary";
              textClasses =
                "text-on-surface-variant group-hover:text-on-surface";
              trailingIcon = (
                <Icon
                  name="radio_button_unchecked"
                  size={20}
                  className="text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                />
              );
            }

            return (
              <button
                key={choice.label}
                onClick={() => handleSelect(choice.label)}
                disabled={disabled}
                role="radio"
                aria-checked={isSelected}
                className={`w-full group flex items-center p-3 rounded-xl transition-all duration-[var(--duration-normal)] active:scale-[0.98] text-left ${optionClasses}`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-headline font-bold text-sm transition-colors shrink-0 ${badgeClasses}`}
                >
                  {choice.label}
                </div>
                <div className={`ml-3 font-body text-base ${textClasses}`}>
                  <MathText text={choice.text} />
                </div>
                <div className="ml-auto shrink-0">{trailingIcon}</div>
              </button>
            );
          })}
        </div>
      )}

      {/* Fallback: warning for multiple_choice questions with missing i18n choices */}
      {question.question_type === "multiple_choice" && (!question.choices || question.choices.length === 0) && (
        <div className="p-4 rounded-xl border border-error/30 bg-error-container/10 text-error text-sm flex items-center gap-3">
          <Icon name="warning" size={20} />
          <span>{t("question.error_no_choices")}</span>
        </div>
      )}

      {/* Grid-in input (FR-15b) */}
      {question.question_type === "grid_in" && (
        <input
          type="text"
          inputMode="decimal"
          placeholder={t("question.enter_answer")}
          aria-label={t("question.enter_answer_aria")}
          autoComplete="off"
          value={selectedAnswer || ""}
          onChange={(e) => onSelect(e.target.value)}
          disabled={disabled}
          className="w-full p-4 text-lg rounded-xl border border-outline-variant/30 bg-surface-container text-on-surface placeholder:text-on-surface-variant/60 outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all font-headline"
        />
      )}
    </div>
  );
}

/** MathText — renders text with inline ($...$) and block ($$...$$) LaTeX using KaTeX. */
export function MathText({ text }: { text: string }) {
  // Split on $$...$$ (block) first, then $...$ (inline) within remaining parts
  const blockParts = text.split(/(\$\$[^$]+\$\$)/g);

  return (
    <>
      {blockParts.map((blockPart, bi) => {
        // Block-level display math: $$...$$
        if (blockPart.startsWith("$$") && blockPart.endsWith("$$") && blockPart.length > 4) {
          const latex = blockPart.slice(2, -2);
          try {
            const html = katex.renderToString(latex, { throwOnError: false, displayMode: true });
            return <div key={bi} className="my-2 overflow-x-auto" dangerouslySetInnerHTML={{ __html: html }} />;
          } catch {
            return <div key={bi} className="my-2">{blockPart}</div>;
          }
        }

        // Within non-block parts, split on inline $...$
        const inlineParts = blockPart.split(/(\$[^$]+\$)/g);
        return (
          <span key={bi}>
            {inlineParts.map((part, i) => {
              if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
                const latex = part.slice(1, -1);
                try {
                  const html = katex.renderToString(latex, { throwOnError: false });
                  return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />;
                } catch {
                  return <span key={i}>{part}</span>;
                }
              }
              return <span key={i}>{part}</span>;
            })}
          </span>
        );
      })}
    </>
  );
}

/** FormulaBlock — renders a raw LaTeX string in display mode (no $...$ delimiters needed). */
export function FormulaBlock({ latex }: { latex: string }) {
  try {
    const html = katex.renderToString(latex, { throwOnError: false, displayMode: true });
    return <div className="overflow-x-auto" dangerouslySetInnerHTML={{ __html: html }} />;
  } catch {
    return <span>{latex}</span>;
  }
}
