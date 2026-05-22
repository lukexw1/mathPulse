/** TheoryPage — Theory articles list and viewer. */

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheoryStore } from "../stores/theoryStore";
import { Icon } from "../components/Icon";
import { ArticleView } from "../components/ArticleView";
import { QuizView } from "../components/QuizView";

export function TheoryPage() {
  const { t } = useTranslation(['translation', 'theory']);
  const {
    articles,
    currentArticle,
    isLoadingList,
    isLoadingArticle,
    listError,
    articleError,
    load,
    loadArticle,
    clearArticle,
  } = useTheoryStore();

  const [showQuiz, setShowQuiz] = useState(false);

  useEffect(() => {
    if (!currentArticle) {
      load();
    }
  }, [load, currentArticle]);

  // Article list view
  if (!currentArticle) {
    if (isLoadingList) {
      return (
        <div className="pt-6 pt-safe pb-20 px-6 max-w-5xl mx-auto">
          <div className="skeleton h-8 w-48 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-24 rounded-xl" />
            ))}
          </div>
        </div>
      );
    }

    if (listError) {
      return (
        <div className="pt-6 pt-safe pb-20 px-6 max-w-5xl mx-auto flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Icon name="cloud_off" size={40} className="text-on-surface-variant mb-4 mx-auto" />
            <p className="text-on-surface-variant">{listError}</p>
            <button
              onClick={load}
              className="mt-4 px-6 py-3 rounded-xl bg-surface-container-low text-primary font-bold text-sm hover:bg-surface-container-high transition-colors active:scale-[0.97]"
            >
              {t("common.retry")}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="pt-6 pt-safe pb-20 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-on-surface mb-2">{t("theory.title")}</h1>
          <p className="text-on-surface-variant text-sm">
            {t("theory.subtitle")}
          </p>
        </div>

        <div className="space-y-3">
          {articles.map((article) => (
            <button
              key={article.subtopic}
              onClick={() => loadArticle(article.subtopic)}
              className="w-full bg-surface-container-low rounded-xl p-4 border border-outline-variant/10 hover:bg-surface-container transition-colors active:scale-[0.98] text-left"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-bold text-on-surface mb-1">
                    {t(`theory:${article.subtopic}.title`, { defaultValue: article.title })}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                    <span className="flex items-center gap-1">
                      <Icon name="schedule" size={14} />
                      {t("theory.min_read", { minutes: article.estimated_minutes })}
                    </span>
                    {article.completed && (
                      <span className="flex items-center gap-1 text-primary">
                        <Icon name="check_circle" size={14} />
                        {t("theory.completed")}
                      </span>
                    )}
                    {article.best_score !== null && (
                      <span className="flex items-center gap-1">
                        <Icon name="star" size={14} />
                        {article.best_score}/5
                      </span>
                    )}
                  </div>
                </div>
                <Icon name="chevron_right" size={20} className="text-on-surface-variant" />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Article view (will be implemented in ArticleView component)
  if (isLoadingArticle) {
    return (
      <div className="pt-6 pt-safe pb-20 px-6 max-w-5xl mx-auto">
        <div className="skeleton h-8 w-48 mb-6" />
        <div className="skeleton h-64 rounded-xl" />
      </div>
    );
  }

  if (articleError) {
    return (
      <div className="pt-6 pt-safe pb-20 px-6 max-w-5xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Icon name="error_outline" size={40} className="text-on-surface-variant mb-4 mx-auto" />
          <p className="text-on-surface-variant">{articleError}</p>
          <button
            onClick={clearArticle}
            className="mt-4 px-6 py-3 rounded-xl bg-surface-container-low text-primary font-bold text-sm hover:bg-surface-container-high transition-colors active:scale-[0.97]"
          >
            {t("theory.back_to_list")}
          </button>
        </div>
      </div>
    );
  }

  // Article content view
  if (showQuiz) {
    return (
      <QuizView
        questionIds={currentArticle.quiz_questions}
        onClose={() => setShowQuiz(false)}
      />
    );
  }

  return (
    <div className="pt-6 pt-safe pb-20 px-6 max-w-5xl mx-auto">
      <button
        onClick={clearArticle}
        className="flex items-center gap-2 text-primary mb-4 hover:opacity-80 transition-opacity"
      >
        <Icon name="arrow_back" size={20} />
        <span className="text-sm font-medium">{t("theory.back")}</span>
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-on-surface mb-2">
          {t(`theory:${currentArticle.subtopic}.title`, { defaultValue: currentArticle.title })}
        </h1>
        <div className="flex items-center gap-3 text-xs text-on-surface-variant">
          <span className="flex items-center gap-1">
            <Icon name="schedule" size={14} />
            {t("theory.min_read", { minutes: currentArticle.estimated_minutes })}
          </span>
          {currentArticle.progress?.completed && (
            <span className="flex items-center gap-1 text-primary">
              <Icon name="check_circle" size={14} />
              {t("theory.completed")}
            </span>
          )}
          {currentArticle.progress?.best_score !== null && currentArticle.progress?.best_score !== undefined && (
            <span className="flex items-center gap-1">
              <Icon name="star" size={14} />
              {currentArticle.progress.best_score}/5
            </span>
          )}
        </div>
      </div>

      <div className="/* ФОН: Светло-серый (чуть темнее белого) / Тёмно-серый (из вашего дизайна) */
  bg-[#f4f4f5] dark:bg-[#1c1c1e] 
  rounded-2xl p-6 
  /* ГРАНИЦА: Тонкая серая / Почти прозрачная белая */
  border border-zinc-200 dark:border-white/5 
  mb-6 
  
  /* H1: Черный / Белый */
  [&_h1]:text-zinc-900 dark:[&_h1]:text-white [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-center [&_h1]:mb-8
  
  /* H2: Ваш Бирюзовый (хорошо читается на обоих фонах) */
  [&_h2]:text-[#1677ff] dark:[&_h2]:text-[#72E5F4] [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-center [&_h2]:mt-10 [&_h2]:mb-4
  
  /* H3: Акцент с полоской. Текст: Почти черный / Белый */
  [&_h3]:pl-4 [&_h3]:border-l-2 [&_h3]:border-[#0891b2] dark:[&_h3]:border-[#72E5F4] 
  [&_h3]:text-zinc-800 dark:[&_h3]:text-white [&_h3]:text-lg [&_h3]:font-medium [&_h3]:mt-6 [&_h3]:mb-3
  
  /* ОСНОВНОЙ ТЕКСТ: Насыщенный серый (для мягкости) / Светло-серый с прозрачностью */
  [&_p]:text-zinc-600 dark:[&_p]:text-[#ebebf5]/60 [&_p]:leading-relaxed [&_p]:mb-4
  
  /* ЖИРНЫЙ ТЕКСТ: Черный / Белый */
  [&_strong]:text-zinc-900 dark:[&_strong]:text-white [&_strong]:font-bold
  
  /* ФОРМУЛЫ (KaTeX): Индиго. На светлом фоне делаем чуть темнее для контраста */
  [&_.katex]:text-violet-700 dark:[&_.katex]:text-violet-300 
  
  /* Подложка для блочных формул: едва заметный фиолетовый оттенок */
  [&_.katex-display]:my-6 [&_.katex-display]:py-4 
  [&_.katex-display]:bg-violet-500/5 dark:[&_.katex-display]:bg-violet-400/10 
  [&_.katex-display]:border-y [&_.katex-display]:border-violet-200 dark:[&_.katex-display]:border-violet-400/20
  [&_.katex-display]:rounded-xl [&_.katex-display]:text-center">
        <ArticleView content={t(`theory:${currentArticle.subtopic}.content`, { defaultValue: currentArticle.content_md })} />
      </div>

      <button
        onClick={() => setShowQuiz(true)}
        className="w-full bg-primary text-on-primary font-bold py-4 rounded-xl hover:opacity-90 transition-opacity active:scale-[0.98] flex items-center justify-center gap-2"
      >
        <Icon name="quiz" size={20} />
        <span>{t("theory.take_quiz")}</span>
      </button>
    </div>
  );
}
