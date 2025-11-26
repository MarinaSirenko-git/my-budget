import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { currencyOptions, type CurrencyCode } from '@/shared/constants/currencies';
import { reportErrorToTelegram } from '@/shared/utils/errorReporting';
import { generateScenarioName } from '@/shared/utils/scenarioName';
import { countryNames, DEFAULT_COUNTRY_NAMES } from '@/shared/constants/countries';
import { createSlug } from '@/shared/utils/slug';
import type { PostgrestError } from '@supabase/supabase-js';
import { CURRENCY_STORAGE_KEY, PLACE_NAME_STORAGE_KEY, LANGUAGE_STORAGE_KEY } from '@/shared/constants/storageKeys';
import { MAX_TEXT_FIELD_LENGTH } from '@/shared/constants/validation';
import { getCountryCodeFromLocale } from '@/shared/utils/locale';

/**
 * Нормализует формат языка (RU/EN -> ru/en)
 */
function normalizeLanguage(lng: string): string {
  const normalized = lng.toLowerCase();
  if (normalized === 'ru' || normalized === 'en') {
    return normalized;
  }
  return 'ru';
}

/**
 * Получает дефолтное имя сценария на основе языка
 */
function getDefaultPlaceName(language: string = 'ru'): string {
  const countryCode = getCountryCodeFromLocale();
  const country = countryNames[countryCode] || DEFAULT_COUNTRY_NAMES;
  return generateScenarioName(language, country.ru, country.en);
}


interface LanguageOption {
  label: string;
  value: string;
}

interface UseSettingsProps {
  userId: string | undefined;
  currentScenarioId: string | null;
  changeLanguage: (lang: string) => void;
  languageOptions: LanguageOption[];
  scenarioSlug?: string | undefined;
  loadCurrentScenarioId: () => Promise<void>;
  loadCurrentScenarioSlug: () => Promise<void>;
  t: (key: string) => string;
}

interface UseSettingsReturn {
  currency: CurrencyCode;
  placeName: string;
  language: string;
  loading: boolean;
  saving: boolean;
  message: string | null;
  isFormValid: boolean;
  handleSave: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  handleCurrencyChange: (newCurrency: string) => void;
  handleLanguageChange: (newLanguage: string) => void;
  handlePlaceNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function useSettings({
  userId,
  currentScenarioId,
  changeLanguage,
  languageOptions,
  scenarioSlug,
  loadCurrentScenarioId,
  loadCurrentScenarioSlug,
  t,
}: UseSettingsProps): UseSettingsReturn {
  const navigate = useNavigate();
  const [currency, setCurrency] = useState<CurrencyCode>(currencyOptions[0].value);
  const [placeName, setPlaceName] = useState(() => getDefaultPlaceName('ru'));
  const [language, setLanguage] = useState('ru');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadSettings = useCallback(async (userIdParam: string) => {
    try {
      setLoading(true);
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('language')
        .eq('id', userIdParam)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        await reportErrorToTelegram({
          action: 'loadProfile',
          error: profileError,
          userId: userIdParam,
          context: { errorCode: profileError.code },
        });
      } else {
        if (currentScenarioId) {
          const { data: scenarios, error: scenariosError } = await supabase
            .from('scenarios')
            .select('id, name, base_currency, created_at')
            .eq('user_id', userIdParam)
            .eq('id', currentScenarioId)
            .single();

          if (scenariosError) {
            await reportErrorToTelegram({
              action: 'loadScenario',
              error: scenariosError,
              userId: userIdParam,
              context: { scenarioId: currentScenarioId, errorCode: scenariosError.code },
            });
          } else if (scenarios) {
            if (scenarios.base_currency) {
              const validCurrency = currencyOptions.find(opt => opt.value === scenarios.base_currency);
              if (validCurrency) {
                setCurrency(validCurrency.value);
              }
            }
            setPlaceName(scenarios.name);
          }
        }

        if (profileData?.language) {
          const normalizedLang = normalizeLanguage(profileData.language);
          const validLanguage = languageOptions.find(opt => opt.value === normalizedLang);
          if (validLanguage) {
            setLanguage(validLanguage.value);
            changeLanguage(validLanguage.value);
          }
        }
      }
    } catch (error) {
      await reportErrorToTelegram({
        action: 'loadSettings',
        error: error,
        userId: userIdParam,
        context: { scenarioId: currentScenarioId },
      });
    } finally {
      setLoading(false);
    }
  }, [currentScenarioId, changeLanguage, languageOptions]);

  useEffect(() => {
    if (userId) {
      loadSettings(userId);
    } else {
      setLoading(false);
    }
  }, [userId, loadSettings]);

  const isFormValid = useMemo(() => {
    return !!placeName.trim();
  }, [placeName]);

  const handleCurrencyChange = useCallback((newCurrency: string) => {
    const validCurrency = currencyOptions.find(opt => opt.value === newCurrency);
    if (validCurrency) {
      setCurrency(validCurrency.value);
    }
  }, []);

  const handleLanguageChange = useCallback((newLanguage: string) => {
    const validLanguage = languageOptions.find(opt => opt.value === newLanguage);
    if (validLanguage) {
      setLanguage(validLanguage.value);
    }
  }, [languageOptions]);

  const handlePlaceNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    if (value.length <= MAX_TEXT_FIELD_LENGTH) {
      setPlaceName(value);
    }
  }, []);

  const handleSave = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userId) {
      console.error(t('settingsForm.loginRequired'));
      return;
    }

    if (!currentScenarioId) {
      setMessage(t('settingsForm.errorMessage'));
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const scenarioNameToSave = placeName || getDefaultPlaceName(language);
      const newSlug = createSlug(scenarioNameToSave);
      const oldSlug = scenarioSlug;

      // Обновляем сценарий в таблице scenarios
      const { error: scenarioError } = await supabase
        .from('scenarios')
        .update({
          name: scenarioNameToSave,
          base_currency: currency,
        })
        .eq('id', currentScenarioId)
        .eq('user_id', userId); // Защита от обновления чужих сценариев

      if (scenarioError) {
        await reportErrorToTelegram({
          action: 'saveScenario',
          error: scenarioError,
          userId,
          context: { scenarioId: currentScenarioId, errorCode: scenarioError.code },
        });
        throw scenarioError;
      }

      // Обновляем язык в profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ language })
        .eq('id', userId);

      if (profileError) {
        await reportErrorToTelegram({
          action: 'saveProfile',
          error: profileError,
          userId,
          context: { errorCode: profileError.code },
        });
        throw profileError;
      }

      // Обновляем кэш
      localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
      localStorage.setItem(PLACE_NAME_STORAGE_KEY, scenarioNameToSave);
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);

      // Отправляем событие об изменении валюты для обновления таблиц
      window.dispatchEvent(new Event('currencyChanged'));

      // Устанавливаем язык в i18n после успешного сохранения
      const normalizedLang = normalizeLanguage(language);
      changeLanguage(normalizedLang);

      window.dispatchEvent(new Event('placeNameChanged'));

      // Обновляем currentScenarioId в store после успешного сохранения
      await loadCurrentScenarioId();
      await loadCurrentScenarioSlug();

      // Если slug изменился, редиректим на новый URL
      if (oldSlug && newSlug !== oldSlug) {
        const currentPath = window.location.pathname;
        const pathWithoutSlug = currentPath.replace(/^\/[^/]+/, '');
        navigate(`/${newSlug}${pathWithoutSlug}`, { replace: true });
      }

      setMessage(t('settingsForm.successMessage'));
    } catch (err) {
      const e = err as PostgrestError;
      console.error('Error saving settings:', e);
      // Не раскрываем детали ошибки пользователю для безопасности
      setMessage(t('settingsForm.errorMessage'));
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  }, [userId, currentScenarioId, placeName, language, currency, scenarioSlug, changeLanguage, loadCurrentScenarioId, loadCurrentScenarioSlug, navigate, t]);

  return {
    currency,
    placeName,
    language,
    loading,
    saving,
    message,
    isFormValid,
    handleSave,
    handleCurrencyChange,
    handleLanguageChange,
    handlePlaceNameChange,
  };
}

