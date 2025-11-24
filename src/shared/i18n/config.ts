import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ruCommon from './locales/ru/common.json';
import ruPages from './locales/ru/pages.json';
import ruComponents from './locales/ru/components.json';
import enCommon from './locales/en/common.json';
import enPages from './locales/en/pages.json';
import enComponents from './locales/en/components.json';
import { supabase } from '@/lib/supabase';

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

// Поддерживаемые языки интерфейса
const SUPPORTED_LANGUAGES = ['ru', 'en'] as const;
type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

/**
 * Маппинг языков браузера на поддерживаемые языки интерфейса
 * Используется для определения языка по navigator.language
 */
function mapBrowserLanguageToSupported(browserLang: string): SupportedLanguage {
  const langCode = browserLang.toLowerCase().split('-')[0]; // Извлекаем базовый код (ru, en, de и т.д.)
  
  // Прямое совпадение
  if (SUPPORTED_LANGUAGES.includes(langCode as SupportedLanguage)) {
    return langCode as SupportedLanguage;
  }
  
  // Маппинг популярных языков на поддерживаемые
  // Например, для пользователей из стран СНГ может быть удобнее русский
  const languageMap: Record<string, SupportedLanguage> = {
    'uk': 'ru', // Украинский -> русский
    'be': 'ru', // Белорусский -> русский
    'kk': 'ru', // Казахский -> русский
    'ky': 'ru', // Киргизский -> русский
    'uz': 'ru', // Узбекский -> русский
    'az': 'ru', // Азербайджанский -> русский
    'hy': 'ru', // Армянский -> русский
    'ka': 'ru', // Грузинский -> русский
    'ro': 'ru', // Румынский -> русский (близость к русскому)
    'bg': 'ru', // Болгарский -> русский
    'sr': 'ru', // Сербский -> русский
    'mk': 'ru', // Македонский -> русский
  };
  
  return languageMap[langCode] || 'en'; // По умолчанию английский для всех остальных
}

/**
 * Функция для нормализации формата языка (RU/EN -> ru/en)
 * Валидирует, что язык поддерживается
 */
function normalizeLanguage(lng: string): SupportedLanguage {
  if (!lng || typeof lng !== 'string') {
    return 'ru';
  }
  
  const normalized = lng.toLowerCase().trim();
  
  // Проверяем, поддерживается ли язык
  if (SUPPORTED_LANGUAGES.includes(normalized as SupportedLanguage)) {
    return normalized as SupportedLanguage;
  }
  
  // Если формат не распознан, возвращаем значение по умолчанию
  return 'ru';
}

/**
 * Получает язык интерфейса с учетом всех источников:
 * 1. localStorage (user_language)
 * 2. Старый ключ localStorage (language) - для обратной совместимости
 * 3. navigator.language - для первого входа
 */
function getLanguage(): SupportedLanguage {
  // 1. Проверяем сохраненный язык в localStorage
  const savedLanguage = localStorage.getItem('user_language');
  if (savedLanguage) {
    return normalizeLanguage(savedLanguage);
  }
  
  // 2. Проверяем старый ключ для обратной совместимости
  const oldLanguage = localStorage.getItem('language');
  if (oldLanguage) {
    const normalized = normalizeLanguage(oldLanguage);
    // Миграция: сохраняем в новый ключ
    localStorage.setItem('user_language', normalized);
    localStorage.removeItem('language');
    return normalized;
  }
  
  // 3. Используем язык браузера как fallback для первого входа
  try {
    const browserLang = navigator.language || navigator.languages?.[0] || 'en';
    const mappedLang = mapBrowserLanguageToSupported(browserLang);
    // Сохраняем для последующих загрузок (но только если это первый вход)
    // Не перезаписываем, если пользователь уже выбрал язык вручную
    return mappedLang;
  } catch (error) {
    console.warn('Error getting browser language:', error);
    return 'ru'; // Fallback на русский по умолчанию
  }
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

/**
 * Загружает язык из профиля пользователя и обновляет i18n
 * Вызывается после инициализации auth для синхронизации языка между устройствами
 * @param userId - ID пользователя
 */
export async function loadLanguageFromProfile(userId: string): Promise<void> {
  try {
    // Проверяем, есть ли уже сохраненный язык в localStorage
    // Если есть, не перезаписываем его (пользователь мог выбрать язык вручную)
    const savedLanguage = localStorage.getItem('user_language');
    if (savedLanguage) {
      // Язык уже установлен, просто убеждаемся, что i18n синхронизирован
      const normalized = normalizeLanguage(savedLanguage);
      if (i18n.language !== normalized) {
        await i18n.changeLanguage(normalized);
      }
      return;
    }

    // Загружаем язык из профиля
    const { data, error } = await supabase
      .from('profiles')
      .select('language')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned (профиль еще не создан)
      console.warn('Error loading language from profile:', error);
      return;
    }

    if (data?.language) {
      const normalized = normalizeLanguage(data.language);
      // Обновляем i18n и localStorage
      await i18n.changeLanguage(normalized);
      localStorage.setItem('user_language', normalized);
    }
  } catch (error) {
    console.warn('Error in loadLanguageFromProfile:', error);
    // Не критично, продолжаем с текущим языком
  }
}

export default i18n;

