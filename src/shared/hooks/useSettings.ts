import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { currencyOptions, type CurrencyCode } from '@/shared/constants/currencies';
import { reportErrorToTelegram } from '@/shared/utils/errorReporting';
import { generateScenarioName } from '@/shared/utils/scenarioName';
import { countryNames, DEFAULT_COUNTRY_NAMES } from '@/shared/constants/countries';
import { CURRENCY_STORAGE_KEY, PLACE_NAME_STORAGE_KEY, LANGUAGE_STORAGE_KEY } from '@/shared/constants/storageKeys';
import { MAX_TEXT_FIELD_LENGTH } from '@/shared/constants/validation';
import { getCountryCodeFromLocale } from '@/shared/utils/locale';
import { sanitizeName } from '@/shared/utils/sanitize';

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
  loadCurrentScenarioData: () => Promise<void>;
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
  hasChanges: boolean;
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
  loadCurrentScenarioData,
  t,
}: UseSettingsProps): UseSettingsReturn {
  const navigate = useNavigate();
  const [currency, setCurrency] = useState<CurrencyCode>(currencyOptions[0].value);
  const [placeName, setPlaceName] = useState(() => getDefaultPlaceName('ru'));
  const [language, setLanguage] = useState('ru');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  
  // Исходные значения для отслеживания изменений
  const [initialCurrency, setInitialCurrency] = useState<CurrencyCode | null>(null);
  const [initialPlaceName, setInitialPlaceName] = useState<string | null>(null);
  const [initialLanguage, setInitialLanguage] = useState<string | null>(null);

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
                setInitialCurrency(validCurrency.value);
              } else {
                // Если валюта не найдена, используем первую из списка
                setInitialCurrency(currencyOptions[0].value);
              }
            } else {
              // Если валюта не задана, используем первую из списка
              setInitialCurrency(currencyOptions[0].value);
            }
            setPlaceName(scenarios.name);
            setInitialPlaceName(scenarios.name);
          } else {
            // Если сценарий не найден, устанавливаем дефолтные значения
            const defaultPlaceName = getDefaultPlaceName('ru');
            setPlaceName(defaultPlaceName);
            setInitialPlaceName(defaultPlaceName);
            setInitialCurrency(currencyOptions[0].value);
          }
        } else {
          // Если currentScenarioId отсутствует, устанавливаем дефолтные значения
          const defaultPlaceName = getDefaultPlaceName('ru');
          setPlaceName(defaultPlaceName);
          setInitialPlaceName(defaultPlaceName);
          setInitialCurrency(currencyOptions[0].value);
        }

        if (profileData?.language) {
          const normalizedLang = normalizeLanguage(profileData.language);
          const validLanguage = languageOptions.find(opt => opt.value === normalizedLang);
          if (validLanguage) {
            setLanguage(validLanguage.value);
            setInitialLanguage(validLanguage.value);
            changeLanguage(validLanguage.value);
          }
        } else {
          // Если язык не загружен, устанавливаем дефолтный и сохраняем как исходный
          setInitialLanguage('ru');
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
  }, [currentScenarioId]);

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

  // Проверка наличия изменений
  const hasChanges = useMemo(() => {
    // Если исходные значения еще не загружены, считаем что изменений нет
    if (initialCurrency === null || initialPlaceName === null || initialLanguage === null) {
      return false;
    }
    
    // Сравниваем текущие значения с исходными (с учетом санитизации для placeName)
    const sanitizedPlaceName = placeName.trimStart().trimEnd();
    const sanitizedInitialPlaceName = initialPlaceName.trimStart().trimEnd();
    
    return (
      currency !== initialCurrency ||
      sanitizedPlaceName !== sanitizedInitialPlaceName ||
      language !== initialLanguage
    );
  }, [currency, placeName, language, initialCurrency, initialPlaceName, initialLanguage]);

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
    const value = e.target.value.replace(/[<>]/g, '');
    if (value.length <= MAX_TEXT_FIELD_LENGTH) {
      setPlaceName(value);
    }
  }, []);

  const handleSave = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saving) {
      console.warn('Save already in progress, ignoring duplicate request');
      return;
    }
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
      // Санитизируем имя перед сохранением (защита от XSS)
      const scenarioNameToSave = sanitizeName(placeName) || getDefaultPlaceName(language);
      const oldSlug = scenarioSlug;

      const { data: renameData, error: scenarioError } = await supabase.rpc('rename_scenario', {
        p_scenario_id: currentScenarioId,
        p_new_name: scenarioNameToSave,
        p_base_currency: currency,
      });

      if (scenarioError) {
        await reportErrorToTelegram({
          action: 'saveScenario',
          error: scenarioError,
          userId,
          context: { scenarioId: currentScenarioId, errorCode: scenarioError.code },
        });
        throw scenarioError;
      }

      const newSlug = renameData?.slug || oldSlug;

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

      localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
      localStorage.setItem(PLACE_NAME_STORAGE_KEY, scenarioNameToSave);
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);

      window.dispatchEvent(new Event('currencyChanged'));
      const normalizedLang = normalizeLanguage(language);
      changeLanguage(normalizedLang);

      window.dispatchEvent(new Event('placeNameChanged'));
      await loadCurrentScenarioData();

      if (oldSlug && newSlug !== oldSlug) {
        const currentPath = window.location.pathname;
        const pathWithoutSlug = currentPath.replace(/^\/[^/]+/, '');
        navigate(`/${newSlug}${pathWithoutSlug}`, { replace: true });
      }

      setMessage(t('settingsForm.successMessage'));
      
      // Обновляем исходные значения после успешного сохранения
      const sanitizedPlaceName = sanitizeName(placeName) || getDefaultPlaceName(language);
      setInitialCurrency(currency);
      setInitialPlaceName(sanitizedPlaceName);
      setInitialLanguage(language);
    } catch (err) {
      setMessage(t('settingsForm.errorMessage'));
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  }, [userId, currentScenarioId, placeName, language, currency, scenarioSlug, changeLanguage, loadCurrentScenarioData, navigate, t]);

  return {
    currency,
    placeName,
    language,
    loading,
    saving,
    message,
    isFormValid,
    hasChanges,
    handleSave,
    handleCurrencyChange,
    handleLanguageChange,
    handlePlaceNameChange,
  };
}

