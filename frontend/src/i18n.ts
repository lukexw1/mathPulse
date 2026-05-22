import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enTranslation from "./locales/en/translation.json";
import ruTranslation from "./locales/ru/translation.json";
import enQuestions from "./locales/en/questions.json";
import ruQuestions from "./locales/ru/questions.json";
import enTheory from "./locales/en/theory.json";
import ruTheory from "./locales/ru/theory.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslation, questions: enQuestions, theory: enTheory },
      ru: { translation: ruTranslation, questions: ruQuestions, theory: ruTheory },
    },
    fallbackLng: "en",
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      lookupLocalStorage: "i18nextLng",
      caches: ["localStorage"],
    },
  });

export default i18n;