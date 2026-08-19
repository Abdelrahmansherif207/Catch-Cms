import type { Language } from '@/shared/constants/api';
import type { JsonObject, LocaleMap, LocalizedText, StaticPageSection } from '../types/static-page.types';

// Resolve a localized string (string | locale map) for the active locale,
// falling back to `en`.
export function localizedText(text: LocalizedText | undefined, lang: Language): string {
  if (!text) return '';
  if (typeof text === 'string') {
    try {
      const parsed = JSON.parse(text) as Record<string, string>;
      return parsed[lang] || parsed.en || text;
    } catch {
      return text;
    }
  }
  return text[lang] || text.en || '';
}

// Resolve content for the active locale, falling back to `en` when the
// locale key is missing (Task 5). Logs a console warning on fallback so
// missing translations are visible during development.
export function resolveLocaleContent(
  content: LocaleMap<JsonObject> | undefined,
  lang: Language
): JsonObject | null {
  if (!content) return null;

  if (content[lang] !== undefined) {
    return content[lang];
  }

  if (lang !== 'en' && content.en !== undefined) {
    console.warn(
      `[static-pages] Missing "${lang}" content — falling back to "en".`
    );
    return content.en;
  }

  return null;
}

export function sectionTitle(section: StaticPageSection, lang: Language): string {
  return localizedText(section.title, lang);
}