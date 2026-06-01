import type { Language } from "./types";

export const LANGUAGE_LABELS: Record<Language, string> = {
  english: "English",
  pidgin: "Nigerian Pidgin English",
  swahili: "Swahili",
  hindi: "Hindi",
};

export function languagePrompt(language: Language | string | undefined): string {
  if (!language) return "English";
  return LANGUAGE_LABELS[language as Language] ?? "English";
}
