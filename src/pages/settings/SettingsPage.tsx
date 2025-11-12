import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/shared/store/auth';
import { supabase } from '@/lib/supabase';
import Form from '@/shared/ui/form/Form';
import TextInput from '@/shared/ui/form/TextInput';
import SelectInput from '@/shared/ui/form/SelectInput';
import TextButton from '@/shared/ui/atoms/TextButton';
import { currencyOptions } from '@/shared/constants/currencies';
import type { PostgrestError } from '@supabase/supabase-js';

const CURRENCY_STORAGE_KEY = 'user_currency';
const PLACE_NAME_STORAGE_KEY = 'user_place_name';
const LANGUAGE_STORAGE_KEY = 'user_language';
const DEFAULT_PLACE_NAME = 'Сценарий #1';

const languageOptions = [
  { label: 'Русский (RU)', value: 'RU' },
  { label: 'English (EN)', value: 'EN' },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const [currency, setCurrency] = useState(currencyOptions[0].value);
  const [placeName, setPlaceName] = useState(DEFAULT_PLACE_NAME);
  const [language, setLanguage] = useState(languageOptions[0].value);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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

        // Try to load from Supabase profiles table
        const { data, error } = await supabase
          .from('profiles')
          .select('default_currency, place_name, language')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('Error loading profile:', error);
          // Fallback to localStorage on error
          loadFromLocalStorage();
        } else if (data) {
          // Load from Supabase
          if (data.default_currency) {
            const validCurrency = currencyOptions.find(opt => opt.value === data.default_currency);
            if (validCurrency) {
              setCurrency(validCurrency.value);
            }
          }
          if (data.place_name) {
            setPlaceName(data.place_name);
          }
          if (data.language) {
            const validLanguage = languageOptions.find(opt => opt.value === data.language);
            if (validLanguage) {
              setLanguage(validLanguage.value);
            }
          }
        } else {
          // No profile found, try localStorage
          loadFromLocalStorage();
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
        const validLanguage = languageOptions.find(opt => opt.value === savedLanguage);
        if (validLanguage) {
          setLanguage(validLanguage.value);
        }
      }
    }

    loadSettings();
  }, [user]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      console.error('Необходимо войти в систему');
      return;
    }
  
    setSaving(true);
    setMessage(null);
  
    try {
      const { data, error } = await supabase.rpc('update_profile_settings', {
        p_default_currency: currency,
        p_place_name: placeName || DEFAULT_PLACE_NAME,
        p_language: language,
      });
  
      if (error) throw error;
  
      // Обновляем кэш
      localStorage.setItem(CURRENCY_STORAGE_KEY, data.default_currency);
      localStorage.setItem(PLACE_NAME_STORAGE_KEY, data.place_name ?? DEFAULT_PLACE_NAME);
      localStorage.setItem(LANGUAGE_STORAGE_KEY, data.language ?? '');
  
      window.dispatchEvent(new Event('placeNameChanged'));
      setMessage('Настройки успешно сохранены');
    } catch (err) {
      const e = err as PostgrestError;
      console.error(e);
      setMessage(e?.message ?? 'Ошибка сохранения настроек');
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

  // Handle place name change
  const handlePlaceNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlaceName(e.target.value.trim());
  };

  // Check if form is valid (required fields are filled)
  const isFormValid = useMemo(() => {
    return !!placeName.trim();
  }, [placeName]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-6">
        <p className="text-textColor dark:text-textColor">Загрузка настроек...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-6 gap-6">
      <h1 className="text-2xl font-semibold text-mainTextColor dark:text-mainTextColor">Настройки</h1>
      
      <div className="max-w-md w-full">
        <Form onSubmit={handleSubmit}>
          <div>
            <label className="block mb-1 text-sm font-medium text-textColor dark:text-textColor">
              Гугловский Email для входа
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
            placeholder="Введите название места"
            className="w-full"
            disabled={saving}
            required
            label="Название сценария"
            id="placeName"
          />

          <SelectInput
            value={currency}
            options={currencyOptions}
            onChange={handleCurrencyChange}
            label="В какой валюте делать расчёты"
            disabled={saving}
          />

          <SelectInput
            value={language}
            options={languageOptions}
            onChange={handleLanguageChange}
            label="Язык интерфейса"
            disabled={saving}
          />

          {message && (
            <div className={`text-sm ${message.includes('Ошибка') ? 'text-accentRed dark:text-accentRed' : 'text-success dark:text-success'}`}>
              {message}
            </div>
          )}

          <div className="pt-2">
            <TextButton
              type="submit"
              variant="primary"
              aria-label="Сохранить настройки"
              className="w-full"
              disabled={!isFormValid || saving}
            >
              {saving ? 'Сохранение...' : 'Сохранить'}
            </TextButton>
          </div>
        </Form>
      </div>
    </div>
  );
}

