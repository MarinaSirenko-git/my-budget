/**
 * Утилиты для работы с locale и языками браузера
 */

/**
 * Валидирует и нормализует locale
 * @param locale - Locale строка (например: 'en', 'en-US', 'ru-RU')
 * @returns Нормализованный locale в формате 'xx-XX' или 'en-US' по умолчанию
 */
export function validateAndNormalizeLocale(locale: string | undefined): string {
  if (!locale || typeof locale !== 'string') {
    return 'en-US';
  }

  // Базовая валидация формата locale (например: en, en-US, ru-RU)
  const localePattern = /^[a-z]{2}(-[A-Z]{2})?$/i;
  if (localePattern.test(locale)) {
    return locale;
  }

  // Пытаемся извлечь язык из некорректного формата
  const langMatch = locale.match(/^([a-z]{2})/i);
  if (langMatch) {
    const lang = langMatch[1].toLowerCase();
    // Маппинг популярных языков
    const langMap: Record<string, string> = {
      ru: 'ru-RU',
      en: 'en-US',
      de: 'de-DE',
      fr: 'fr-FR',
      es: 'es-ES',
      it: 'it-IT',
      pt: 'pt-BR',
      ja: 'ja-JP',
      zh: 'zh-CN',
      ko: 'ko-KR',
    };
    return langMap[lang] || 'en-US';
  }

  return 'en-US';
}

/**
 * Извлекает код страны из locale
 * @param locale - Locale строка (например: 'en-US', 'ru-RU')
 * @returns Код страны (например: 'US', 'RU') или 'US' по умолчанию
 */
export function getCountryCodeFromLocale(locale?: string): string {
  const normalizedLocale = validateAndNormalizeLocale(locale || navigator.language || 'en-US');
  const countryCode = normalizedLocale.split('-')[1];
  return countryCode || 'US';
}

/**
 * Валидирует timezone строку
 * @param timezone - Timezone строка (например: 'Europe/Moscow', 'America/New_York')
 * @returns Валидный timezone или 'UTC' по умолчанию
 */
export function validateTimezone(timezone: string | undefined): string {
  if (!timezone || typeof timezone !== 'string') {
    return 'UTC';
  }

  if (timezone.length > 100) {
    console.warn('Timezone too long, using UTC');
    return 'UTC';
  }

  const timezonePattern = /^[A-Za-z_]+\/[A-Za-z_]+$/;
  if (timezonePattern.test(timezone) || timezone === 'UTC') {
    return timezone;
  }

  return 'UTC';
}

/**
 * Определяет язык интерфейса из navigator.language
 * Маппит на поддерживаемые языки (ru, en)
 * @param browserLang - Язык браузера (например: 'ru-RU', 'en-US', 'uk-UA')
 * @returns Код языка интерфейса: 'ru' или 'en'
 */
export function detectInterfaceLanguage(browserLang: string): 'ru' | 'en' {
  const langCode = browserLang.toLowerCase().split('-')[0];
  
  if (langCode === 'ru' || langCode === 'en') {
    return langCode;
  }
  
  const russianSpeakingRegions = ['uk', 'be', 'kk', 'ky', 'uz', 'az', 'hy', 'ka', 'ro', 'bg', 'sr', 'mk'];
  if (russianSpeakingRegions.includes(langCode)) {
    return 'ru';
  }
  
  return 'en';
}

/**
 * Получает timezone и locale из браузера с обработкой ошибок
 * @returns Объект с валидированными timezone и locale, а также исходным locale для определения языка интерфейса
 */
export function getBrowserLocaleAndTimezone(): {
  timezone: string;
  locale: string;
  rawLocale: string;
} {
  let tz: string;
  let loc: string;

  try {
    tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    loc = navigator.language || 'en-US';
  } catch (intlError) {
    // В production можно отправлять в Telegram, но это не критичная ошибка
    tz = 'UTC';
    loc = 'en-US';
  }

  return {
    timezone: validateTimezone(tz),
    locale: validateAndNormalizeLocale(loc),
    rawLocale: loc, // Исходный locale для detectInterfaceLanguage
  };
}

