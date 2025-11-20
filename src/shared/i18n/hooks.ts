import { useCallback } from 'react';
import { useTranslation as useI18nTranslation } from 'react-i18next';

/**
 * Хук для использования переводов
 * @param namespace - пространство имен (common, pages, components)
 * @returns объект с функциями перевода
 */
export const useTranslation = (namespace?: string) => {
  return useI18nTranslation(namespace);
};

/**
 * Хук для переключения языка
 * @returns функция для изменения языка
 */
export const useLanguage = () => {
  const { i18n } = useI18nTranslation();

  const changeLanguage = useCallback((lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('user_language', lng);
  }, [i18n]);

  return {
    currentLanguage: i18n.language,
    changeLanguage,
    availableLanguages: ['ru', 'en'],
  };
};

