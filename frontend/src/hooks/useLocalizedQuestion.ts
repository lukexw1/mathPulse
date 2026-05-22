/** Hook: merges API Question with i18n localized text (stem, choices, hint).
 *
 * When backend returns question_key only (no stem/choices/hint),
 * this hook hydrates the Question from the `questions` i18n namespace.
 *
 * If backend still returns stem/choices/hint (legacy mode),
 * they are used directly (backward compatible during migration).
 */

import { useTranslation } from "react-i18next";
import type { Question } from "../types";

export function useLocalizedQuestion(raw: Question | null): Question | null {
  const { i18n } = useTranslation();

  if (!raw) return null;

  // Legacy mode: backend still sends stem/choices/hint — use them as-is
  if (raw.stem && raw.stem.length > 0) {
    return {
      ...raw,
      stem: raw.stem,
      choices: raw.choices ?? null,
      hint: raw.hint ?? null,
    };
  }

  const key = raw.question_key;
  if (!key) return raw;

  const ns = i18n.getResourceBundle(i18n.language, "questions");
  if (!ns || !ns[key]) {
    // Fallback: try English if current language missing
    const enNs = i18n.getResourceBundle("en", "questions");
    if (!enNs || !enNs[key]) return raw;
    return _hydrate(raw, key, enNs);
  }

  return _hydrate(raw, key, ns);
}

function _hydrate(raw: Question, key: string, ns: Record<string, unknown>): Question {
  const qData = ns[key] as Record<string, unknown>;

  // For grid_in or questions without i18n choices, only hydrate stem & hint
  let choices = raw.choices;
  if (qData.choices && typeof qData.choices === "object") {
    choices = Object.entries(qData.choices).map(([label, text]) => ({
      label,
      text: String(text),
    }));
  }

  return {
    ...raw,
    stem: String(qData.stem ?? raw.stem ?? ""),
    choices,
    hint: qData.hint ? String(qData.hint) : raw.hint ?? null,
  };
}
