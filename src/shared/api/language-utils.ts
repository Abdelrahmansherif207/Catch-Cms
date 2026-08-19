import { STORAGE_KEYS, DEFAULT_LANGUAGE, type Language } from '@/shared/constants/api';

export function getStoredLanguage(): Language {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  const stored = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
  if (stored) {
    const base = stored.split('-')[0] as Language;
    if (base === 'en' || base === 'ar') return base;
  }
  return DEFAULT_LANGUAGE;
}
