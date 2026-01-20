import { useState, useMemo, useEffect } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '@/shared/i18n';
import SettingsForm from '@/features/settings/SettingsForm';
import LoadingState from '@/shared/ui/atoms/LoadingState';
import { currencyOptions, DEFAULT_CURRENCY, type CurrencyCode } from '@/shared/constants/currencies';
import { getLanguageOptions } from '@/shared/utils/categories';
import { MAX_TEXT_FIELD_LENGTH } from '@/shared/constants/validation';
import { useUser } from '@/shared/hooks/useUser';
import { useProfile } from '@/shared/hooks/useProfile';
import { useCurrency } from '@/shared/hooks/useCurrency';
import { useScenario } from '@/shared/hooks/useScenario';
import { supabase } from '@/lib/supabase';
import i18n from '@/shared/i18n/config';
import { reportErrorToTelegram } from '@/shared/utils/errorReporting';

export default function SettingsPage() {
  const { t } = useTranslation('components');
  const queryClient = useQueryClient();
  
  // Data hooks
  const { user, loading: userLoading } = useUser();
  const { profile, loading: profileLoading } = useProfile();
  const { currency: baseCurrency, loading: currencyLoading } = useCurrency();
  const { currentScenario, loading: scenarioLoading } = useScenario();
  
  // Form state
  const [currency, setCurrency] = useState<CurrencyCode>(DEFAULT_CURRENCY);
  const [placeName, setPlaceName] = useState('');
  const [language, setLanguage] = useState('en');
  
  // Original values for change detection
  const [originalCurrency, setOriginalCurrency] = useState<CurrencyCode>(DEFAULT_CURRENCY);
  const [originalPlaceName, setOriginalPlaceName] = useState('');
  const [originalLanguage, setOriginalLanguage] = useState('en');
  
  // Saving and message state
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  
  const languageOptions = useMemo(() => getLanguageOptions(t), [t]);
  
  // Initialize form state from fetched data
  useEffect(() => {
    if (profile && currentScenario) {
      const profileLanguage = profile.language || 'en';
      const scenarioName = currentScenario.name || '';
      const scenarioCurrency = baseCurrency || DEFAULT_CURRENCY;
      
      setLanguage(profileLanguage);
      setPlaceName(scenarioName);
      setCurrency(scenarioCurrency);
      
      // Set original values
      setOriginalLanguage(profileLanguage);
      setOriginalPlaceName(scenarioName);
      setOriginalCurrency(scenarioCurrency);
    }
  }, [profile, currentScenario, baseCurrency]);

  // Form validation
  const isFormValid = useMemo(() => {
    return !!placeName.trim();
  }, [placeName]);

  const hasChanges = useMemo(() => {
    return (
      placeName !== originalPlaceName ||
      currency !== originalCurrency ||
      language !== originalLanguage
    );
  }, [placeName, originalPlaceName, currency, originalCurrency, language, originalLanguage]);
  
  const loading = userLoading || profileLoading || currencyLoading || scenarioLoading;
  const userEmail = user?.email;

  // Event handlers
  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    if (!isFormValid || !hasChanges || saving) return;
    if (!user?.id || !currentScenario) return;
    
    setSaving(true);
    setMessage(null);
    
    const scenarioNameChanged = placeName.trim() !== originalPlaceName;
    const currencyChanged = currency !== originalCurrency;
    const languageChanged = language !== originalLanguage;
    
    try {
      // Update scenario name and/or base currency if changed
      if (scenarioNameChanged || currencyChanged) {
        const { error: scenarioError } = await supabase.rpc('rename_scenario', {
          p_scenario_id: currentScenario.id,
          p_new_name: placeName.trim(),
          p_base_currency: currency,
        });
        
        if (scenarioError) {
          throw new Error('Failed to update scenario');
        }
        
        // Invalidate scenario and profile caches
        queryClient.invalidateQueries({ queryKey: ['scenarios', 'current'] });
        // queryClient.invalidateQueries({ queryKey: ['scenarios', 'list'] });

        if(currencyChanged){
          queryClient.invalidateQueries({ queryKey: ['profile'] });
        }

        if (currencyChanged && currentScenario.id) {
          queryClient.invalidateQueries({ queryKey: ['convertedIncomes', currentScenario.id] });
          queryClient.invalidateQueries({ queryKey: ['incomeTotals', currentScenario.id] });
        }
      }
      
      // Update language if changed
      if (languageChanged) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ language })
          .eq('id', profile!.id);
        
        if (profileError) {
          throw new Error('Failed to update language');
        }
        
        // Update i18next language
        await i18n.changeLanguage(language);
        
        // Invalidate profile cache
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      }
      
      // Update original values to reflect saved state
      setOriginalPlaceName(placeName.trim());
      setOriginalCurrency(currency);
      setOriginalLanguage(language);
      
      setMessage(t('settingsForm.successMessage') || 'Settings saved successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setMessage(null);
      }, 3000);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('settingsForm.errorMessage') || 'Failed to save settings';
      setMessage(errorMessage);
      
      await reportErrorToTelegram({
        action: 'saveSettings',
        error: err,
        userId: user.id,
        context: {
          scenarioId: currentScenario.id,
          scenarioNameChanged,
          currencyChanged,
          languageChanged,
        },
      });
    } finally {
      setSaving(false);
    }
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
  
  // Don't render form if we don't have the necessary data yet
  if (!profile || !currentScenario) {
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
