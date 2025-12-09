// handle auth callback from Supabase

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useTranslation, useLanguage } from '@/shared/i18n';
import { useAuth } from '@/shared/store/auth';
import { detectInterfaceLanguage, getBrowserLocaleAndTimezone } from '@/shared/utils/locale';
import { waitForScenarioCreation, loadUserScenarios } from '@/shared/utils/scenarios';
import { reportErrorToTelegram } from '@/shared/utils/errorReporting';
import ModalWindow from '@/shared/ui/ModalWindow';
import { type CurrencyCode, DEFAULT_CURRENCY } from '@/shared/constants/currencies';
import FirstScenarioCurrencyForm from '@/features/scenarios/FirstScenarioCurrencyForm';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { t } = useTranslation('pages');
  const { t: tComponents } = useTranslation('components');
  const { changeLanguage } = useLanguage();
  const { loadCurrentScenarioData } = useAuth();
  
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>(DEFAULT_CURRENCY);
  const [savingCurrency, setSavingCurrency] = useState(false);
  const [pendingScenarioId, setPendingScenarioId] = useState<string | null>(null);
  const [pendingScenarioSlug, setPendingScenarioSlug] = useState<string | null>(null);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // Extract code and error from URL
        const url = new URL(window.location.href);
        const searchParams = url.searchParams;
        const hashParams = new URLSearchParams(url.hash.substring(1));
        
        const hasCode = searchParams.has('code') || hashParams.has('code');
        const hasError = searchParams.has('error') || hashParams.has('error');
        if (hasError) {
          const error = searchParams.get('error') || hashParams.get('error');
          const errorDescription = searchParams.get('error_description') || hashParams.get('error_description');
          
          await reportErrorToTelegram({
            action: 'authCallbackError',
            error: new Error(`Auth error in URL: ${error} - ${errorDescription || 'No description'}`),
            context: { error, errorDescription },
          });
          
          navigate('/auth', { replace: true, state: { error } });
          return;
        }
        
        let user = null;
        
          if (hasCode) {
            // Exchange code for session
            const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(window.location.href);
            if (exchangeError) {
              if (exchangeError.message.includes('invalid request')) {
                await reportErrorToTelegram({
                  action: 'authCodeExchangeInvalid',
                  error: exchangeError,
                  context: { message: 'No valid auth code in URL, checking existing session' },
                });
              } else {
                await reportErrorToTelegram({
                  action: 'authCodeExchangeError',
                  error: exchangeError,
                  context: { hasCode: true },
                });
                navigate('/auth', { replace: true });
                return;
              }
            } else if (data?.user) {
            user = data.user;
            // Clear auth parameters from URL
            window.history.replaceState({}, document.title, '/auth-callback');
          }
        } else {
          await reportErrorToTelegram({
            action: 'authCodeNotFound',
            error: new Error('No auth code in URL, checking existing session'),
            context: { message: 'No auth code in URL, checking existing session' },
          });
        }

        // If user is not found, check existing session
        if (!user) {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) {
            await reportErrorToTelegram({
              action: 'sessionError',
              error: sessionError,
              context: { message: 'Error getting session' },
            });
            navigate('/auth', { replace: true });
            return;
          }
          
          if (session?.user) {
            user = session.user;
          } else {
            const { data: { user: userData }, error: userError } = await supabase.auth.getUser();
            if (userError || !userData) {
              await reportErrorToTelegram({
                action: 'userNotFound',
                error: new Error('No user found, redirecting to auth'),
                context: { message: 'No user found, redirecting to auth' },
              });
              navigate('/auth', { replace: true });
              return;
            }
            user = userData;
          }
        }


        const { timezone: validatedTimezone, locale: validatedLocale, rawLocale } = getBrowserLocaleAndTimezone();
        
        // Get language and created_at from profile
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('language, created_at')
          .eq('id', user.id)
          .single();
        
        let normalizedLang: 'ru' | 'en';
        
        if (existingProfile?.language) {
          // Язык есть в профиле - используем его
          normalizedLang = existingProfile.language.toLowerCase() === 'ru' ? 'ru' : 'en';
        } else {
          // If language is not in profile, get it from browser and save to profile
          const interfaceLanguage = detectInterfaceLanguage(rawLocale);
          normalizedLang = interfaceLanguage;
          
          const { error: profileLangError } = await supabase
            .from('profiles')
            .update({ language: normalizedLang })
            .eq('id', user.id);
          
          if (profileLangError) {
            await reportErrorToTelegram({
              action: 'saveLanguageToProfile',
              error: profileLangError,
              userId: user.id,
              context: { language: normalizedLang },
            });
          }
        }
        
        // Update i18n and localStorage based on language from profile
        changeLanguage(normalizedLang);
        localStorage.setItem('user_language', normalizedLang);

        // Wait for scenario creation by trigger (if it's not created yet)
        let currentScenarioId: string | null = null;
        
        // First try to load through store
        // await loadCurrentScenarioId();
        const authState = useAuth.getState();
        currentScenarioId = authState.currentScenarioId;

        // If scenario is not found, wait for it to be created
        if (!currentScenarioId) {
          currentScenarioId = await waitForScenarioCreation(user.id);
          
          if (currentScenarioId) {
            await loadCurrentScenarioData();
          }
        }

        if (!currentScenarioId) {
          navigate('/auth', { replace: true, state: { error: 'scenario_creation_failed' } });
          return;
        }

        // Load slug for scenario
        let currentScenarioSlug = useAuth.getState().currentScenarioSlug;

        // Check if this is a new user (profile created within last 5 minutes)
        const isNewUser = existingProfile?.created_at && 
          new Date(existingProfile.created_at).getTime() > Date.now() - 5 * 60 * 1000; // 5 minutes

        // Check if this is the first scenario
        // Note: At this point, the scenario is already created in the database by the trigger
        // So we check if the user has exactly 1 scenario (the first one)
        const allScenarios = await loadUserScenarios(user.id);
        const isFirstScenario = allScenarios && allScenarios.length === 1;

        if (isFirstScenario && isNewUser) {
          // Determine suggested currency based on locale
          let suggestedCurrency: CurrencyCode = DEFAULT_CURRENCY;
          const localeLower = validatedLocale.toLowerCase();
          
          // Simple currency mapping based on locale
          if (localeLower.includes('ru')) {
            suggestedCurrency = 'RUB';
          } else if (localeLower.includes('th')) {
            suggestedCurrency = 'THB';
          } else if (localeLower.includes('gb') || localeLower.includes('uk')) {
            suggestedCurrency = 'GBP';
          } else if (localeLower.includes('jp')) {
            suggestedCurrency = 'JPY';
          } else if (localeLower.includes('cn')) {
            suggestedCurrency = 'CNY';
          } else if (localeLower.includes('kr')) {
            suggestedCurrency = 'KRW';
          } else if (localeLower.includes('eu') || localeLower.includes('de') || localeLower.includes('fr') || localeLower.includes('es') || localeLower.includes('it')) {
            suggestedCurrency = 'EUR';
          }

          setPendingScenarioId(currentScenarioId);
          setPendingScenarioSlug(currentScenarioSlug);
          setPendingUserId(user.id);
          setSelectedCurrency(suggestedCurrency);
          setShowCurrencyModal(true);
          return;
        }

        // Check if currency is already set in the scenario
        // Only call set_currency_from_client if currency is not set
        const { data: scenarioData, error: scenarioCheckError } = await supabase
          .from('scenarios')
          .select('base_currency')
          .eq('id', currentScenarioId)
          .eq('user_id', user.id)
          .single();

        // Only set currency if it's not already set
        if (!scenarioCheckError && scenarioData && !scenarioData.base_currency) {
          const { error: rpcError } = await supabase.rpc('set_currency_from_client', {
            p_timezone: validatedTimezone,
            p_locale: validatedLocale
          });

          if (rpcError) {
            await reportErrorToTelegram({
              action: 'setCurrencyFromClient',
              error: rpcError,
              userId: user.id,
              context: { 
                timezone: validatedTimezone, 
                locale: validatedLocale,
                scenarioId: currentScenarioId 
              },
            });
            
            const { error: fallbackError } = await supabase
              .from('scenarios')
              .update({ base_currency: 'USD' })
              .eq('id', currentScenarioId)
              .eq('user_id', user.id);

            if (fallbackError) {
              await reportErrorToTelegram({
                action: 'setFallbackCurrency',
                error: fallbackError,
                userId: user.id,
                context: { scenarioId: currentScenarioId },
              });
            }
          }
        }

        // Redirect to scenario goals page
        navigate(`/${currentScenarioSlug}/income`, { replace: true });

        } catch (error) {
          await reportErrorToTelegram({
            action: 'unexpectedError',
            error: error as Error,
            context: { message: 'Unexpected error in AuthCallback' },
          });
        navigate('/auth', { replace: true, state: { error: 'unexpected_error' } });
      }
    })();
  }, [navigate, loadCurrentScenarioData, changeLanguage]);

  const handleCurrencyConfirm = async () => {
    if (!pendingScenarioId) return;

    setSavingCurrency(true);
    try {
      const { error } = await supabase
        .from('scenarios')
        .update({ base_currency: selectedCurrency })
        .eq('id', pendingScenarioId);
        
      if (error) {
        await reportErrorToTelegram({
          action: 'setFirstScenarioCurrency',
          error: error,
          userId: pendingUserId || '',
          context: { scenarioId: pendingScenarioId, currency: selectedCurrency },
        });
      }
      setShowCurrencyModal(false);
      navigate(`/${pendingScenarioSlug}/income`, { replace: true });
    } catch (error) {
      throw error;
    } finally {
      setSavingCurrency(false);
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <img 
        src="/src/assets/auth-page-mouse1.webp" 
        alt="Auth Background" 
        className="absolute inset-0 w-full h-full object-cover" 
      />
      
      <div className="absolute inset-0 bg-accentRed/50" />
      
      <div className="relative z-10 flex items-center justify-center h-full">
        <p className="text-white text-lg font-medium">{t('auth.signingIn')}</p>
      </div>
      
      <ModalWindow
        open={showCurrencyModal}
        onClose={() => {}}
        title={tComponents('firstScenarioCurrency.title')}
      >
        <FirstScenarioCurrencyForm
          selectedCurrency={selectedCurrency}
          setSelectedCurrency={setSelectedCurrency}
          savingCurrency={savingCurrency}
          onConfirm={handleCurrencyConfirm}
          t={tComponents}
        />
      </ModalWindow>
    </div>
  );
}