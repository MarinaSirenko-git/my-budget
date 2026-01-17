import { useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useLanguage, useTranslation } from '@/shared/i18n';
import SettingsForm from '@/features/settings/SettingsForm';
import LoadingState from '@/shared/ui/atoms/LoadingState';
import { currencyOptions } from '@/shared/constants/currencies';
import { getLanguageOptions } from '@/shared/utils/categories';
import { useSettings } from '@/shared/hooks';
import { MAX_TEXT_FIELD_LENGTH } from '@/shared/constants/validation';
import { supabase } from '@/lib/supabase';

export default function SettingsPage() {
  const { t } = useTranslation('components');
  const { scenarioSlug } = useParams<{ scenarioSlug: string }>();
  const queryClient = useQueryClient();
  const user = queryClient.getQueryData(['user']) as { id?: string; email?: string } | null;
  const currentScenario = queryClient.getQueryData(['currentScenario']) as { 
    id?: string | null; 
    slug?: string | null; 
    baseCurrency?: string | null;
  } | null;
  const currentScenarioId = currentScenario?.id ?? null;
  
  const loadCurrentScenarioData = useCallback(async () => {
    if (!user?.id) return;
    
    const { data: profileCtx } = await supabase
      .from('profiles')
      .select(`
        id,
        language,
        current_scenario_id,
        current_scenario_slug,
        current_scenario:scenarios!profiles_current_scenario_fkey (
          id,
          slug,
          base_currency
        )
      `)
      .eq('id', user.id)
      .maybeSingle();
    
    if (profileCtx) {
      queryClient.setQueryData(['profile'], profileCtx);
      
      const currentScenarioData = Array.isArray(profileCtx.current_scenario)
        ? profileCtx.current_scenario[0] ?? null
        : profileCtx.current_scenario ?? null;
      
      queryClient.setQueryData(['currentScenario'], {
        id: profileCtx.current_scenario_id ?? null,
        slug: profileCtx.current_scenario_slug ?? null,
        baseCurrency: currentScenarioData?.base_currency ?? null,
      });
    }
  }, [user?.id, queryClient]);
  const { changeLanguage } = useLanguage();
  const languageOptions = useMemo(() => getLanguageOptions(t), [t]);
  
  const {
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
  } = useSettings({
    userId: user?.id,
    currentScenarioId,
    changeLanguage,
    languageOptions,
    scenarioSlug,
    loadCurrentScenarioData,
    t,
  });

  if (loading) {
    return <LoadingState message={t('settingsForm.loading')} className="flex-col p-6" />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-2 lg:p-6 gap-4 lg:gap-6">
      <h1 className="text-xl lg:text-2xl font-semibold text-mainTextColor dark:text-mainTextColor">{t('settingsForm.title')}</h1>
      
      <div className="max-w-md w-full">
        <SettingsForm
          handleSubmit={handleSave}
          userEmail={user?.email}
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

