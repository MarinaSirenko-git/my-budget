import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/shared/store/auth';
import { supabase } from '@/lib/supabase';
import Form from '@/shared/ui/form/Form';
import TextInput from '@/shared/ui/form/TextInput';
import SelectInput from '@/shared/ui/form/SelectInput';
import TextButton from '@/shared/ui/atoms/TextButton';
import LoadingState from '@/shared/ui/atoms/LoadingState';
import { currencyOptions } from '@/shared/constants/currencies';
import { useLanguage, useTranslation } from '@/shared/i18n';
import { createSlug } from '@/shared/utils/slug';
import type { PostgrestError } from '@supabase/supabase-js';

const CURRENCY_STORAGE_KEY = 'user_currency';
const PLACE_NAME_STORAGE_KEY = 'user_place_name';
const LANGUAGE_STORAGE_KEY = 'user_language';
const DEFAULT_PLACE_NAME = 'Сценарий #1';
const MAX_PLACE_NAME_LENGTH = 100; // Максимальная длина названия сценария

// Функция для нормализации формата языка (RU/EN -> ru/en)
function normalizeLanguage(lng: string): string {
  const normalized = lng.toLowerCase();
  if (normalized === 'ru' || normalized === 'en') {
    return normalized;
  }
  // Если формат не распознан, возвращаем значение по умолчанию
  return 'ru';
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { scenarioSlug } = useParams<{ scenarioSlug: string }>();
  const { user, currentScenarioId, loadCurrentScenarioId, loadCurrentScenarioSlug } = useAuth();
  const { changeLanguage } = useLanguage();
  const { t } = useTranslation('components');
  const [currency, setCurrency] = useState(currencyOptions[0].value);
  const [placeName, setPlaceName] = useState(DEFAULT_PLACE_NAME);
  const [language, setLanguage] = useState('ru');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const languageOptions = useMemo(() => [
    { label: t('settingsForm.russian'), value: 'ru' },
    { label: t('settingsForm.english'), value: 'en' },
  ], [t]);

  // Load saved settings from Supabase profiles table and localStorage fallback
  useEffect(() => {
    async function loadSettings() {
      if (!user) {
        // Fallback to localStorage if no user
        loadFromLocalStorage();
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Загружаем currentScenarioId из store (он уже загружен в init)
        // Загружаем язык из profiles
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('language')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('Error loading profile:', profileError);
          // Fallback to localStorage on error
          loadFromLocalStorage();
        } else {
          // Используем currentScenarioId из store
          if (currentScenarioId) {
            // КРИТИЧНО: Фильтруем scenarios по user_id для предотвращения доступа к чужим данным
            const { data: scenarios, error: scenariosError } = await supabase
              .from('scenarios')
              .select('id, name, base_currency, created_at')
              .eq('user_id', user.id)
              .eq('id', currentScenarioId)
              .single();

            if (!scenariosError && scenarios) {
              if (scenarios.base_currency) {
                const validCurrency = currencyOptions.find(opt => opt.value === scenarios.base_currency);
                if (validCurrency) {
                  setCurrency(validCurrency.value);
                }
              }
              setPlaceName(scenarios.name);
            }
          }

          // Load language from Supabase
          if (profileData?.language) {
            // Миграция: преобразуем RU/EN в ru/en
            const normalizedLang = normalizeLanguage(profileData.language);
            const validLanguage = languageOptions.find(opt => opt.value === normalizedLang);
            if (validLanguage) {
              setLanguage(validLanguage.value);
              // Устанавливаем язык в i18n
              changeLanguage(validLanguage.value);
            }
          } else {
            // No profile found, try localStorage
            loadFromLocalStorage();
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        loadFromLocalStorage();
      } finally {
        setLoading(false);
      }
    }

    function loadFromLocalStorage() {
      const savedCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY);
      if (savedCurrency) {
        const validCurrency = currencyOptions.find(opt => opt.value === savedCurrency);
        if (validCurrency) {
          setCurrency(validCurrency.value);
        }
      }

      const savedPlaceName = localStorage.getItem(PLACE_NAME_STORAGE_KEY);
      if (savedPlaceName) {
        setPlaceName(savedPlaceName);
      }

      const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLanguage) {
        // Миграция: преобразуем RU/EN в ru/en
        const normalizedLang = normalizeLanguage(savedLanguage);
        const validLanguage = languageOptions.find(opt => opt.value === normalizedLang);
        if (validLanguage) {
          setLanguage(validLanguage.value);
          // Устанавливаем язык в i18n
          changeLanguage(validLanguage.value);
        }
      }
    }

    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentScenarioId]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
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
      const scenarioNameToSave = placeName || DEFAULT_PLACE_NAME;
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
        .eq('user_id', user.id); // Защита от обновления чужих сценариев

      if (scenarioError) throw scenarioError;

      // Валюта уже обновлена в scenarios.base_currency выше, дополнительная синхронизация не нужна

      // Обновляем язык в profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ language })
        .eq('id', user.id);

      if (profileError) throw profileError;

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
  };

  // Handle currency change (only updates state, doesn't save)
  const handleCurrencyChange = (newCurrency: string) => {
    const validCurrency = currencyOptions.find(opt => opt.value === newCurrency);
    if (validCurrency) {
      setCurrency(validCurrency.value);
    }
  };

  // Handle language change (only updates state, doesn't save)
  const handleLanguageChange = (newLanguage: string) => {
    const validLanguage = languageOptions.find(opt => opt.value === newLanguage);
    if (validLanguage) {
      setLanguage(validLanguage.value);
    }
  };

  // Handle place name change with validation
  const handlePlaceNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    // Ограничиваем длину для предотвращения DoS атак
    if (value.length <= MAX_PLACE_NAME_LENGTH) {
      setPlaceName(value);
    }
  };

  // Check if form is valid (required fields are filled)
  const isFormValid = useMemo(() => {
    return !!placeName.trim();
  }, [placeName]);

  if (loading) {
    return <LoadingState message={t('settingsForm.loading')} className="flex-col p-6" />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-6 gap-6">
      <h1 className="text-2xl font-semibold text-mainTextColor dark:text-mainTextColor">{t('settingsForm.title')}</h1>
      
      <div className="max-w-md w-full">
        <Form onSubmit={handleSubmit}>
          <div>
            <label className="block mb-1 text-sm font-medium text-textColor dark:text-textColor">
              {t('settingsForm.googleEmailLabel')}
            </label>
            <TextInput
              type="email"
              value={user?.email || ''}
              readOnly
              className="w-full bg-contentBg dark:bg-cardColor cursor-not-allowed"
            />
          </div>

          <TextInput
            type="text"
            value={placeName}
            onChange={handlePlaceNameChange}
            placeholder={t('settingsForm.scenarioNamePlaceholder')}
            className="w-full"
            disabled={saving}
            required
            maxLength={MAX_PLACE_NAME_LENGTH}
            label={t('settingsForm.scenarioNameLabel')}
            id="placeName"
          />

          <SelectInput
            value={currency}
            options={currencyOptions}
            onChange={handleCurrencyChange}
            label={t('settingsForm.currencyLabel')}
            disabled={saving}
          />

          <SelectInput
            value={language}
            options={languageOptions}
            onChange={handleLanguageChange}
            label={t('settingsForm.languageLabel')}
            disabled={saving}
          />

          {message && (
            <div 
              className={`text-sm ${message.includes(t('settingsForm.errorMessage')) ? 'text-accentRed dark:text-accentRed' : 'text-success dark:text-success'}`}
              role="alert"
            >
              {/* React автоматически экранирует содержимое, но для безопасности используем textContent */}
              {message}
            </div>
          )}

          <div className="pt-2">
            <TextButton
              type="submit"
              variant="primary"
              aria-label={t('settingsForm.saveAriaLabel')}
              className="w-full"
              disabled={!isFormValid || saving}
            >
              {saving ? t('settingsForm.savingButton') : t('settingsForm.saveButton')}
            </TextButton>
          </div>
        </Form>
      </div>
    </div>
  );
}

