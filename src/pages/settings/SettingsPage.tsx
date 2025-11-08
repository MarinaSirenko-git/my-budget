import { useState, useEffect } from 'react';
import { useAuth } from '@/shared/store/auth';
import Form from '@/shared/ui/form/Form';
import TextInput from '@/shared/ui/form/TextInput';
import SelectInput from '@/shared/ui/form/SelectInput';
import TextButton from '@/shared/ui/atoms/TextButton';
import { currencyOptions } from '@/shared/constants/currencies';

const CURRENCY_STORAGE_KEY = 'user_currency';
const PLACE_NAME_STORAGE_KEY = 'user_place_name';
const DEFAULT_PLACE_NAME = 'Phuket';

export default function SettingsPage() {
  const { user } = useAuth();
  const [currency, setCurrency] = useState(currencyOptions[0].value);
  const [placeName, setPlaceName] = useState(DEFAULT_PLACE_NAME);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Load saved settings from localStorage on mount
  useEffect(() => {
    const savedCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (savedCurrency && currencyOptions.some(opt => opt.value === savedCurrency)) {
      setCurrency(savedCurrency);
    }

    const savedPlaceName = localStorage.getItem(PLACE_NAME_STORAGE_KEY);
    if (savedPlaceName) {
      setPlaceName(savedPlaceName);
    }
  }, []);

  // Handle currency change
  const handleCurrencyChange = async (newCurrency: string) => {
    setCurrency(newCurrency);
    setSaving(true);
    setMessage(null);

    try {
      // Save to localStorage
      localStorage.setItem(CURRENCY_STORAGE_KEY, newCurrency);
      
      // TODO: Save to Supabase user settings table if needed
      // const { error } = await supabase
      //   .from('user_settings')
      //   .upsert({ user_id: user?.id, currency: newCurrency });

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
    <div className="flex flex-col p-6 gap-6 min-h-[calc(100vh-100px)]">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Настройки</h1>
      
      <div className="max-w-md">
        <Form>
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
              Email для входа
            </label>
            <TextInput
              type="email"
              value={user?.email || ''}
              readOnly
              className="w-full bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
              Название места
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
            label="Валюта"
            disabled={saving}
          />

          {message && (
            <div className={`text-sm ${message.includes('Ошибка') ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
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

