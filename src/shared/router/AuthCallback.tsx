// handle auth callback from Supabase

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useTranslation, useLanguage } from '@/shared/i18n';
import { useAuth } from '@/shared/store/auth';
import { detectInterfaceLanguage, getBrowserLocaleAndTimezone } from '@/shared/utils/locale';
import { waitForScenarioCreation, getScenarioSlug } from '@/shared/utils/scenarios';
import { reportErrorToTelegram } from '@/shared/utils/errorReporting';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { t } = useTranslation('pages');
  const { changeLanguage } = useLanguage();
  const { loadCurrentScenarioId, loadCurrentScenarioSlug } = useAuth();

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
        
        // Get language from profile
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('language')
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
        await loadCurrentScenarioId();
        const authState = useAuth.getState();
        currentScenarioId = authState.currentScenarioId;

        // If scenario is not found, wait for it to be created
        if (!currentScenarioId) {
          console.log('Scenario not found, waiting for trigger to create it...');
          currentScenarioId = await waitForScenarioCreation(user.id);
          
          if (currentScenarioId) {
            await loadCurrentScenarioId();
          }
        }

        if (!currentScenarioId) {
          navigate('/auth', { replace: true, state: { error: 'scenario_creation_failed' } });
          return;
        }

        // Load slug for scenario
        await loadCurrentScenarioSlug();
        let currentScenarioSlug = useAuth.getState().currentScenarioSlug;

        // If slug is not loaded, get it directly
        if (!currentScenarioSlug) {
          currentScenarioSlug = await getScenarioSlug(currentScenarioId, user.id);
          if (currentScenarioSlug) {
            await loadCurrentScenarioSlug();
          }
        }

        // Set currency through RPC with error handling
        // TODO: Preapare it in trigger
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
  }, [navigate, loadCurrentScenarioId, loadCurrentScenarioSlug, changeLanguage]);

  return <p>{t('auth.signingIn')}</p>;
}