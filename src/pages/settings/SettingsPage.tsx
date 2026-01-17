import { useState, useMemo } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { useTranslation } from '@/shared/i18n';
import SettingsForm from '@/features/settings/SettingsForm';
import LoadingState from '@/shared/ui/atoms/LoadingState';
import { currencyOptions, type CurrencyCode } from '@/shared/constants/currencies';
import { getLanguageOptions } from '@/shared/utils/categories';
import { MAX_TEXT_FIELD_LENGTH } from '@/shared/constants/validation';

export default function SettingsPage() {
  const { t } = useTranslation('components');
  
  // Form state
  const [currency, setCurrency] = useState<CurrencyCode>(currencyOptions[0].value);
  const [placeName, setPlaceName] = useState('');
  const [language, setLanguage] = useState('ru');
  
  // Data placeholders
  const loading = false;
  const saving = false;
  const message: string | null = null;
  const userEmail: string | undefined = undefined;
  
  const languageOptions = useMemo(() => getLanguageOptions(t), [t]);

  // Form validation
  const isFormValid = useMemo(() => {
    return !!placeName.trim();
  }, [placeName]);

  const hasChanges = true; // Always true for now since we don't track original values

  // Event handlers
  function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Empty stub - no business logic
  }

  function handleCurrencyChange(newCurrency: string) {
    const validCurrency = currencyOptions.find(opt => opt.value === newCurrency);
    if (validCurrency) {
      setCurrency(validCurrency.value);
    }
  }

  function handleLanguageChange(newLanguage: string) {
    const validLanguage = languageOptions.find(opt => opt.value === newLanguage);
    if (validLanguage) {
      setLanguage(validLanguage.value);
    }
  }

  function handlePlaceNameChange(e: ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.replace(/[<>]/g, '');
    if (value.length <= MAX_TEXT_FIELD_LENGTH) {
      setPlaceName(value);
    }
  }

  if (loading) {
    return <LoadingState message={t('settingsForm.loading')} className="flex-col p-6" />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-2 lg:p-6 gap-4 lg:gap-6">
      <h1 className="text-xl lg:text-2xl font-semibold text-mainTextColor dark:text-mainTextColor">{t('settingsForm.title')}</h1>
      
      <div className="max-w-md w-full">
        <SettingsForm
          handleSubmit={handleSave}
          userEmail={userEmail}
          placeName={placeName}
          handlePlaceNameChange={handlePlaceNameChange}
          currency={currency}
          handleCurrencyChange={handleCurrencyChange}
          language={language}
          handleLanguageChange={handleLanguageChange}
          currencyOptions={currencyOptions}
          languageOptions={languageOptions}
          isFormValid={isFormValid}
          hasChanges={hasChanges}
          saving={saving}
          message={message}
          maxPlaceNameLength={MAX_TEXT_FIELD_LENGTH}
          t={t}
        />
      </div>
    </div>
  );
}
