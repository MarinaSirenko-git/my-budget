/**
 * Маппинг кодов стран (ISO 3166-1 alpha-2) на названия стран на русском и английском языках
 * Используется для генерации имен сценариев
 */
export const countryNames: Record<string, { ru: string; en: string }> = {
  'RU': { ru: 'Россия', en: 'Russia' },
  'US': { ru: 'США', en: 'USA' },
  'GB': { ru: 'Великобритания', en: 'UK' },
  'DE': { ru: 'Германия', en: 'Germany' },
  'FR': { ru: 'Франция', en: 'France' },
  'IT': { ru: 'Италия', en: 'Italy' },
  'ES': { ru: 'Испания', en: 'Spain' },
  'CN': { ru: 'Китай', en: 'China' },
  'JP': { ru: 'Япония', en: 'Japan' },
  'KR': { ru: 'Южная Корея', en: 'South Korea' },
  'CA': { ru: 'Канада', en: 'Canada' },
  'AU': { ru: 'Австралия', en: 'Australia' },
  'BR': { ru: 'Бразилия', en: 'Brazil' },
  'IN': { ru: 'Индия', en: 'India' },
  'TR': { ru: 'Турция', en: 'Turkey' },
  'PL': { ru: 'Польша', en: 'Poland' },
  'NL': { ru: 'Нидерланды', en: 'Netherlands' },
  'BE': { ru: 'Бельгия', en: 'Belgium' },
  'CH': { ru: 'Швейцария', en: 'Switzerland' },
  'AT': { ru: 'Австрия', en: 'Austria' },
  'SE': { ru: 'Швеция', en: 'Sweden' },
  'NO': { ru: 'Норвегия', en: 'Norway' },
  'DK': { ru: 'Дания', en: 'Denmark' },
  'FI': { ru: 'Финляндия', en: 'Finland' },
  'GR': { ru: 'Греция', en: 'Greece' },
  'PT': { ru: 'Португалия', en: 'Portugal' },
  'CZ': { ru: 'Чехия', en: 'Czech Republic' },
  'HU': { ru: 'Венгрия', en: 'Hungary' },
  'RO': { ru: 'Румыния', en: 'Romania' },
  'BG': { ru: 'Болгария', en: 'Bulgaria' },
  'UA': { ru: 'Украина', en: 'Ukraine' },
  'BY': { ru: 'Беларусь', en: 'Belarus' },
  'KZ': { ru: 'Казахстан', en: 'Kazakhstan' },
  'UZ': { ru: 'Узбекистан', en: 'Uzbekistan' },
  'TH': { ru: 'Таиланд', en: 'Thailand' },
  'VN': { ru: 'Вьетнам', en: 'Vietnam' },
  'ID': { ru: 'Индонезия', en: 'Indonesia' },
  'MY': { ru: 'Малайзия', en: 'Malaysia' },
  'SG': { ru: 'Сингапур', en: 'Singapore' },
  'PH': { ru: 'Филиппины', en: 'Philippines' },
  'MX': { ru: 'Мексика', en: 'Mexico' },
  'AR': { ru: 'Аргентина', en: 'Argentina' },
  'CL': { ru: 'Чили', en: 'Chile' },
  'CO': { ru: 'Колумбия', en: 'Colombia' },
  'PE': { ru: 'Перу', en: 'Peru' },
  'ZA': { ru: 'ЮАР', en: 'South Africa' },
  'EG': { ru: 'Египет', en: 'Egypt' },
  'IL': { ru: 'Израиль', en: 'Israel' },
  'AE': { ru: 'ОАЭ', en: 'UAE' },
  'SA': { ru: 'Саудовская Аравия', en: 'Saudi Arabia' },
};

/**
 * Дефолтные названия страны, если код страны не найден в маппинге
 */
export const DEFAULT_COUNTRY_NAMES = { ru: 'Страна', en: 'Country' };







