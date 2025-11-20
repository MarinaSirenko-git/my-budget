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

// Функция для получения языка с миграцией старых форматов
function getLanguage(): string {
  const savedLanguage = localStorage.getItem('user_language');
  if (!savedLanguage) {
    // Проверяем старый ключ для обратной совместимости
    const oldLanguage = localStorage.getItem('language');
    if (oldLanguage) {
      return normalizeLanguage(oldLanguage);
    }
    return 'ru';
  }
  return normalizeLanguage(savedLanguage);
}

// Функция для нормализации формата языка (RU/EN -> ru/en)
function normalizeLanguage(lng: string): string {
  const normalized = lng.toLowerCase();
  if (normalized === 'ru' || normalized === 'en') {
    return normalized;
  }
  // Если формат не распознан, возвращаем значение по умолчанию
  return 'ru';
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getLanguage(),
    fallbackLng: 'ru',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;

