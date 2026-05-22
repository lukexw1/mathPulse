/** QuizView — Quiz component for theory articles. */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import { useTheoryStore } from "../stores/theoryStore";
import { Icon } from "./Icon";
import { MathText } from "./QuestionCard";
import { fetchQuestionsByIds } from "../functions/client";
import type { Question } from "../types";

interface QuizViewProps {
  questionIds: string[];
  onClose: () => void;
}

export function QuizView({ questionIds, onClose }: QuizViewProps) {
  const { t } = useTranslation();
  const {
    quizAnswers,
    quizResult,
    isSubmittingQuiz,
    quizError,
    selectQuizAnswer,
    submitQuiz,
    resetQuiz,
  } = useTheoryStore();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Fetch quiz questions and hydrate from i18n
  useEffect(() => {
    const fetchQuestions = async () => {
      setIsLoadingQuestions(true);
      setLoadError(null);
      try {
        const response = await fetchQuestionsByIds(questionIds);
        if (response.data) {
          // Hydrate each question from i18n if stem is empty (backend returns only question_key)
          const hydrated = response.data.map((q) => {
            // If stem is already populated, no hydration needed
            if (q.stem && q.stem.length > 0) return q;
            if (!q.question_key) return q;
            const ns = i18n.getResourceBundle(i18n.language, "questions");
            const enNs = i18n.getResourceBundle("en", "questions");
            const qData = (ns && ns[q.question_key]) || (enNs && enNs[q.question_key]);
            if (!qData) return q;
            // Hydrate stem from i18n
            const stem = String(qData.stem ?? q.stem ?? "");
            // Hydrate choices from i18n only if backend didn't provide them
            let choices = q.choices;
            if ((!choices || choices.length === 0) && qData.choices && typeof qData.choices === "object") {
              choices = Object.entries(qData.choices).map(([label, text]) => ({
                label,
                text: String(text),
              }));
            }
            return {
              ...q,
              stem,
              choices,
              hint: qData.hint ? String(qData.hint) : q.hint,
            };
          });
          setQuestions(hydrated);
        } else {
          setLoadError(response.error || "Failed to load questions");
        }
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : "Network error");
      } finally {
        setIsLoadingQuestions(false);
      }
    };

    fetchQuestions();
  }, [questionIds, i18n]);

  const handleSubmit = async () => {
    if (Object.keys(quizAnswers).length < questions.length) {
      return; // Not all questions answered
    }
    await submitQuiz();
  };

  const handleRetry = () => {
    resetQuiz();
  };

  // Loading state
  if (isLoadingQuestions) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-on-surface-variant">{t("quiz.loading_questions")}</p>
        </div>
      </div>
    );
  }

  // Load error state
  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center px-6">
          <Icon name="error_outline" size={48} className="text-error mx-auto mb-4" />
          <p className="text-on-surface mb-2">{t("quiz.error_loading")}</p>
          <p className="text-on-surface-variant text-sm mb-4">{loadError}</p>
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl bg-primary text-on-primary font-bold"
          >
            {t("quiz.back_to_article")}
          </button>
        </div>
      </div>
    );
  }

  // Result view
  if (quizResult) {
    const passed = quizResult.passed;
    const scoreColor = passed ? "text-tertiary" : "text-error";

    return (
      <div className="min-h-screen">
        <div className="pt-6 pt-safe pb-20 px-6 max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className={`text-6xl font-bold ${scoreColor} mb-2`}>
              {quizResult.score}/5
            </div>
            <div className="text-2xl font-bold text-on-surface mb-2">
              {passed ? t("quiz.quiz_passed") : t("quiz.try_again")}
            </div>
            <div className="text-on-surface-variant">
              {t("quiz.percentage_correct", { percentage: quizResult.percentage })}
            </div>
            <div className="flex items-center justify-center gap-2 mt-4 text-primary">
              <Icon name="stars" size={20} />
              <span className="font-bold">+{quizResult.xp_earned} XP</span>
            </div>
          </div>

          {/* Results breakdown */}
          <div className="space-y-3 mb-6">
            {quizResult.results.map((result, idx) => (
              <div
                key={result.question_id}
                className={`p-4 rounded-xl border ${
                  result.correct
                    ? "bg-tertiary-container border-tertiary/30"
                    : "bg-error-container border-error/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    name={result.correct ? "check_circle" : "cancel"}
                    filled
                    size={24}
                    className={result.correct ? "text-tertiary" : "text-error"}
                  />
                  <div className="flex-1">
                    <div className="font-bold text-on-surface">{t("quiz.question", { number: idx + 1 })}</div>
                    <div className="text-sm text-on-surface-variant">
                      {result.correct
                        ? t("quiz.correct")
                        : t("quiz.your_answer", { selected: result.selected_index + 1, correct: result.correct_index + 1 })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {!passed && (
              <button
                onClick={handleRetry}
                className="w-full bg-primary text-on-primary font-bold py-4 rounded-xl hover:opacity-90 transition-opacity active:scale-[0.98]"
              >
                {t("quiz.try_again")}
              </button>
            )}
            <button
              onClick={onClose}
              className="w-full bg-surface-container-low text-on-surface font-bold py-4 rounded-xl hover:bg-surface-container transition-colors active:scale-[0.98]"
            >
              {passed ? t("quiz.continue") : t("quiz.return_to_article")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Quiz questions view
  return (
    <div className="min-h-screen">
      <div className="pt-6 pt-safe pb-24 px-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity"
          >
            <Icon name="arrow_back" size={20} />
            <span className="text-sm font-medium">{t("theory.back")}</span>
          </button>
          <div className="text-sm text-on-surface-variant">
            {t("quiz.answers_count", { count: Object.keys(quizAnswers).length, total: questions.length })}
          </div>
        </div>

        <h2 className="text-2xl font-bold text-on-surface mb-6">{t("quiz.title")}</h2>

        {/* Questions */}
        <div className="space-y-6 mb-6">
          {questions.map((question, idx) => (
            <div
              key={question.id}
              className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="text-on-surface leading-relaxed">
                    <MathText text={question.stem || "_loading_"} />
                  </div>
                </div>
              </div>

              {question.question_type === "multiple_choice" && question.choices && (
                <div className="space-y-2 ml-11">
                  {question.choices.map((choice, choiceIdx) => {
                    const isSelected = quizAnswers[question.id] === choiceIdx;
                    return (
                      <button
                        key={choice.label}
                        onClick={() => selectQuizAnswer(question.id, choiceIdx)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          isSelected
                            ? "bg-primary/10 border-primary text-on-surface"
                            : "bg-surface-container border-outline-variant/20 text-on-surface hover:bg-surface-container-high"
                        }`}
                      >
                        <span className="font-bold mr-2">{choice.label}.</span>
                        <MathText text={choice.text} />
                      </button>
                    );
                  })}
                </div>
              )}

              {question.question_type === "grid_in" && (
                <div className="ml-11">
                  <input
                    type="text"
                    placeholder={t("quiz.enter_answer")}
                    value={quizAnswers[question.id] ?? ""}
                    onChange={(e) => selectQuizAnswer(question.id, parseInt(e.target.value) || 0)}
                    className="w-full p-3 rounded-lg border border-outline-variant/20 bg-surface-container text-on-surface"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {quizError && (
          <div className="bg-error-container text-error p-4 rounded-xl mb-4">
            {quizError}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={Object.keys(quizAnswers).length < questions.length || isSubmittingQuiz}
          className="w-full bg-primary text-on-primary font-bold py-4 rounded-xl hover:opacity-90 transition-opacity active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmittingQuiz ? t("quiz.sending") : t("quiz.submit_answers")}
        </button>
      </div>
    </div>
  );
}