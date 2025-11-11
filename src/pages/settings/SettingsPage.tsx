import { useState, useEffect } from 'react';
import { useAuth } from '@/shared/store/auth';
import Form from '@/shared/ui/form/Form';
import TextInput from '@/shared/ui/form/TextInput';
import SelectInput from '@/shared/ui/form/SelectInput';
import TextButton from '@/shared/ui/atoms/TextButton';
import { currencyOptions } from '@/shared/constants/currencies';

const CURRENCY_STORAGE_KEY = 'user_currency';
const PLACE_NAME_STORAGE_KEY = 'user_place_name';
const LANGUAGE_STORAGE_KEY = 'user_language';
const DEFAULT_PLACE_NAME = 'Phuket';

const languageOptions = [
  { label: 'Русский (RU)', value: 'RU' },
  { label: 'English (EN)', value: 'EN' },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const [currency, setCurrency] = useState(currencyOptions[0].value);
  const [placeName, setPlaceName] = useState(DEFAULT_PLACE_NAME);
  const [language, setLanguage] = useState(languageOptions[0].value);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Load saved settings from localStorage on mount
  useEffect(() => {
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
  }, []);

  // Handle currency change
  const handleCurrencyChange = async (newCurrency: string) => {
    const validCurrency = currencyOptions.find(opt => opt.value === newCurrency);
    if (!validCurrency) {
      return;
    }
    
    setCurrency(validCurrency.value);
    setSaving(true);
    setMessage(null);

    try {
      // Save to localStorage
      localStorage.setItem(CURRENCY_STORAGE_KEY, validCurrency.value);
      
      // TODO: Save to Supabase user settings table if needed
      // const { error } = await supabase
      //   .from('user_settings')
      //   .upsert({ user_id: user?.id, currency: validCurrency.value });

      setMessage('Валюта успешно сохранена');
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error saving currency:', error);
      setMessage('Ошибка сохранения валюты');
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  // Handle language change
  const handleLanguageChange = async (newLanguage: string) => {
    const validLanguage = languageOptions.find(opt => opt.value === newLanguage);
    if (!validLanguage) {
      return;
    }
    
    setLanguage(validLanguage.value);
    setSaving(true);
    setMessage(null);

    try {
      // Save to localStorage
      localStorage.setItem(LANGUAGE_STORAGE_KEY, validLanguage.value);
      
      // TODO: Save to Supabase user settings table if needed
      // const { error } = await supabase
      //   .from('user_settings')
      //   .upsert({ user_id: user?.id, language: validLanguage.value });

      setMessage('Язык успешно сохранен');
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error saving language:', error);
      setMessage('Ошибка сохранения языка');
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  // Handle place name change
  const handlePlaceNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPlaceName = e.target.value.trim();
    setPlaceName(newPlaceName || DEFAULT_PLACE_NAME);
  };

  // Handle place name save
  const handlePlaceNameSave = () => {
    try {
      const nameToSave = placeName.trim() || DEFAULT_PLACE_NAME;
      localStorage.setItem(PLACE_NAME_STORAGE_KEY, nameToSave);
      
      // Dispatch custom event to update PlaceName component in Header
      window.dispatchEvent(new Event('placeNameChanged'));
      
      setMessage('Название места успешно сохранено');
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error saving place name:', error);
      setMessage('Ошибка сохранения названия места');
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-6 gap-6">
      <h1 className="text-2xl font-semibold text-mainTextColor dark:text-mainTextColor">Настройки</h1>
      
      <div className="max-w-md w-full">
        <Form>
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

          <div>
            <label className="block mb-1 text-sm font-medium text-textColor dark:text-textColor">
              Название сценария
            </label>
            <TextInput
              type="text"
              value={placeName}
              onChange={handlePlaceNameChange}
              placeholder="Введите название места"
              className="w-full"
            />
          </div>

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
              onClick={handlePlaceNameSave}
              variant="primary"
              aria-label="Сохранить настройки"
              className="w-full"
            >
              Сохранить
            </TextButton>
          </div>
        </Form>
      </div>
    </div>
  );
}

