export type CurrencyCode =
  | 'USD' | 'EUR' | 'THB' | 'RUB' | 'GBP' | 'JPY' | 'CNY' | 'KRW'
  | 'AUD' | 'CAD' | 'CHF' | 'SEK' | 'NOK' | 'DKK' | 'PLN' | 'CZK'
  | 'HUF' | 'TRY' | 'INR' | 'IDR' | 'VND' | 'MYR' | 'SGD' | 'HKD'
  | 'NZD' | 'PHP' | 'MXN' | 'BRL' | 'ZAR' | 'ILS' | 'AED' | 'SAR';

export interface CurrencyOption {
  label: string;
  value: CurrencyCode;
}

export const currencyOptions: CurrencyOption[] = [
  { label: 'USD - US Dollar', value: 'USD' },
  { label: 'EUR - Euro', value: 'EUR' },
  { label: 'THB - Thai Baht', value: 'THB' },
  { label: 'RUB - Russian Ruble', value: 'RUB' },
  { label: 'GBP - British Pound', value: 'GBP' },
  { label: 'JPY - Japanese Yen', value: 'JPY' },
  { label: 'CNY - Chinese Yuan', value: 'CNY' },
  { label: 'KRW - South Korean Won', value: 'KRW' },
  { label: 'AUD - Australian Dollar', value: 'AUD' },
  { label: 'CAD - Canadian Dollar', value: 'CAD' },
  { label: 'CHF - Swiss Franc', value: 'CHF' },
  { label: 'SEK - Swedish Krona', value: 'SEK' },
  { label: 'NOK - Norwegian Krone', value: 'NOK' },
  { label: 'DKK - Danish Krone', value: 'DKK' },
  { label: 'PLN - Polish Zloty', value: 'PLN' },
  { label: 'CZK - Czech Koruna', value: 'CZK' },
  { label: 'HUF - Hungarian Forint', value: 'HUF' },
  { label: 'TRY - Turkish Lira', value: 'TRY' },
  { label: 'INR - Indian Rupee', value: 'INR' },
  { label: 'IDR - Indonesian Rupiah', value: 'IDR' },
  { label: 'VND - Vietnamese Dong', value: 'VND' },
  { label: 'MYR - Malaysian Ringgit', value: 'MYR' },
  { label: 'SGD - Singapore Dollar', value: 'SGD' },
  { label: 'HKD - Hong Kong Dollar', value: 'HKD' },
  { label: 'NZD - New Zealand Dollar', value: 'NZD' },
  { label: 'PHP - Philippine Peso', value: 'PHP' },
  { label: 'MXN - Mexican Peso', value: 'MXN' },
  { label: 'BRL - Brazilian Real', value: 'BRL' },
  { label: 'ZAR - South African Rand', value: 'ZAR' },
  { label: 'ILS - Israeli Shekel', value: 'ILS' },
  { label: 'AED - UAE Dirham', value: 'AED' },
  { label: 'SAR - Saudi Riyal', value: 'SAR' },
];

// Helper function to get currency label by value
export function getCurrencyLabel(value: string): string {
  const currency = currencyOptions.find(c => c.value === value);
  return currency?.label || value;
}

/**
 * Валидирует код валюты и возвращает валидный CurrencyCode или null
 */
export function validateCurrency(currency: string | null | undefined): CurrencyCode | null {
  if (!currency || typeof currency !== 'string') {
    return null;
  }
  const validCurrency = currencyOptions.find(opt => opt.value === currency);
  return validCurrency ? (validCurrency.value as CurrencyCode) : null;
}

/**
 * Проверяет, является ли строка валидным кодом валюты
 */
export function isValidCurrency(currency: string | null | undefined): currency is CurrencyCode {
  return validateCurrency(currency) !== null;
}

/**
 * Дефолтная валюта
 */
export const DEFAULT_CURRENCY: CurrencyCode = 'USD';

