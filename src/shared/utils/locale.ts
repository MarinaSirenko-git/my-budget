export function validateAndNormalizeLocale(locale: string | undefined): string {
  if (!locale || typeof locale !== 'string') {
    return 'en-US';
  }

  const localePattern = /^[a-z]{2}(-[A-Z]{2})?$/i;
  if (localePattern.test(locale)) {
    return locale;
  }

  const langMatch = locale.match(/^([a-z]{2})/i);
  if (langMatch) {
    const lang = langMatch[1].toLowerCase();
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

export function getCountryCodeFromLocale(locale?: string): string {
  const normalizedLocale = validateAndNormalizeLocale(locale || navigator.language || 'en-US');
  const countryCode = normalizedLocale.split('-')[1];
  return countryCode || 'US';
}

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
    tz = 'UTC';
    loc = 'en-US';
  }

  return {
    timezone: validateTimezone(tz),
    locale: validateAndNormalizeLocale(loc),
    rawLocale: loc,
  };
}

