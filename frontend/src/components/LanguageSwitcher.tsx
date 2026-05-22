/** LanguageSwitcher — toggle between English and Russian. */

import { useTranslation } from "react-i18next";
import { Icon } from "./Icon";

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === "ru" ? "en" : "ru";
    void i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      aria-label={t("language.switch_to")}
      className="flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl bg-surface-container-low text-on-surface-variant font-headline font-bold text-xs uppercase tracking-wider hover:bg-surface-container transition-colors active:scale-[0.95]"
    >
      <Icon name="language" size={18} />
      <span>{i18n.language === "ru" ? "EN" : "RU"}</span>
    </button>
  );
}