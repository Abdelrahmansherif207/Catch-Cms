import { useSyncExternalStore } from 'react';
import i18n from 'i18next';
import { getStoredLanguage } from '@/shared/api/language-utils';
import { type Language } from '@/shared/constants/api';

const initialLanguage = getStoredLanguage();
document.documentElement.dir = initialLanguage === 'ar' ? 'rtl' : 'ltr';
document.documentElement.lang = initialLanguage;

function getSnapshot(): Language {
  return getStoredLanguage();
}

function subscribe(callback: () => void) {
  i18n.on('languageChanged', callback);
  return () => i18n.off('languageChanged', callback);
}

export function setLanguage(lang: Language) {
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
  i18n.changeLanguage(lang);
}

export function useLanguage() {
  const language = useSyncExternalStore(subscribe, getSnapshot);

  return {
    language,
    isRTL: language === 'ar',
    setLanguage,
  };
}
