import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslation from './locales/en/translation.json';
import arTranslation from './locales/ar/translation.json';
import { STORAGE_KEYS, DEFAULT_LANGUAGE } from '@/shared/constants/api';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslation },
      ar: { translation: arTranslation },
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: STORAGE_KEYS.LANGUAGE,
      caches: ['localStorage'],
    },
    supportedLngs: ['en', 'ar'],
    nonExplicitSupportedLngs: true,
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
