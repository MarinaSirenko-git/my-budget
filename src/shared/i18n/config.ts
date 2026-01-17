import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ruCommon from './locales/ru/common.json';
import ruPages from './locales/ru/pages.json';
import ruComponents from './locales/ru/components.json';
import enCommon from './locales/en/common.json';
import enPages from './locales/en/pages.json';
import enComponents from './locales/en/components.json';

const resources = {
  ru: {
    common: ruCommon,
    pages: ruPages,
    components: ruComponents,
  },
  en: {
    common: enCommon,
    pages: enPages,
    components: enComponents,
  },
};

const SUPPORTED_LANGUAGES = ['ru', 'en'] as const;
type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];


function mapBrowserLanguageToSupported(browserLang: string): SupportedLanguage {
  const langCode = browserLang.toLowerCase().split('-')[0];
  
  if (SUPPORTED_LANGUAGES.includes(langCode as SupportedLanguage)) {
    return langCode as SupportedLanguage;
  }
  
  const languageMap: Record<string, SupportedLanguage> = {
    'uk': 'ru',
    'be': 'ru',
    'kk': 'ru',
    'ky': 'ru',
    'uz': 'ru',
    'az': 'ru',
    'hy': 'ru',
    'ka': 'ru',
    'ro': 'ru',
    'bg': 'ru',
    'sr': 'ru',
    'mk': 'ru',
  };
  
  return languageMap[langCode] || 'en';
}

function normalizeLanguage(lng: string): SupportedLanguage {
  if (!lng || typeof lng !== 'string') {
    return 'en';
  }
  
  const normalized = lng.toLowerCase().trim();
  
  if (SUPPORTED_LANGUAGES.includes(normalized as SupportedLanguage)) {
    return normalized as SupportedLanguage;
  }
  return 'en';
}

function getInitialLanguage(): SupportedLanguage {
  const browserLang = navigator.language || navigator.languages?.[0] || 'en';
  return mapBrowserLanguageToSupported(browserLang);
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export async function loadLanguageFromProfile(language: string): Promise<void> {
  if (language) {
    const normalized = normalizeLanguage(language);
    await i18n.changeLanguage(normalized);
  }
}

export default i18n;

