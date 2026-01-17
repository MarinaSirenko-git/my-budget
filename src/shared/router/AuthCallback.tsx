// handle auth callback from Supabase

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useTranslation, useLanguage } from '@/shared/i18n';
import { detectInterfaceLanguage, getBrowserLocaleAndTimezone } from '@/shared/utils/locale';
import { useQueryClient } from '@tanstack/react-query';
import { reportErrorToTelegram } from '@/shared/utils/errorReporting';
import ModalWindow from '@/shared/ui/ModalWindow';
import { type CurrencyCode, DEFAULT_CURRENCY } from '@/shared/constants/currencies';
import FirstScenarioCurrencyForm from '@/features/scenarios/FirstScenarioCurrencyForm';
import { fetchUser } from '@/shared/hooks/useUser';
import { fetchProfile, type Profile } from '@/shared/hooks/useProfile';
import type { CurrentScenario } from '../hooks/useScenario';

export default function AuthCallback() {
  const navigate = useNavigate();
  const ranRef = useRef(false);
  const queryClient = useQueryClient();
  const { t } = useTranslation('pages');
  const { t: tComponents } = useTranslation('components');
  const { changeLanguage } = useLanguage();

  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>(DEFAULT_CURRENCY);
  const [savingCurrency, setSavingCurrency] = useState(false);
  const [pendingScenarioId, setPendingScenarioId] = useState<string | null>(null);
  const [pendingScenarioSlug, setPendingScenarioSlug] = useState<string | null>(null);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

    useEffect(() => {
      (async () => {
        if (ranRef.current) return;
        ranRef.current = true;
  
        try {
          const url = new URL(window.location.href);
          const code = url.searchParams.get("code");
          const error = url.searchParams.get("error");
          const errorDescription = url.searchParams.get("error_description");
          let user = undefined;
  
          if (error) {
            await reportErrorToTelegram({
              action: "authCallbackError",
              error: new Error(`OAuth error: ${error} - ${errorDescription ?? "No description"}`),
              context: { error, errorDescription },
            });
            navigate("/auth", { replace: true, state: { error } });
            return;
          }

          if (code) {
            const { data, error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(window.location.href);
  
            if (exchangeError || !data?.user) {
              await reportErrorToTelegram({
                action: "authCodeExchangeError",
                error: exchangeError ?? new Error("exchangeCodeForSession returned no user"),
                context: { pathname: location.pathname, search: location.search },
              });
              navigate("/auth", { replace: true });
              return;
            }
  
          user = data.user;
          queryClient.setQueryData(['user'], user);
  
          window.history.replaceState({}, document.title, '/auth-callback');
        } else {
          user = await fetchUser();
          if (!user) {
            await reportErrorToTelegram({
              action: "authCodeExchangeError",
              error: new Error("getSession returned no user"),
              context: { pathname: location.pathname, search: location.search },
            });
            navigate("/auth", { replace: true });
            return;
          }
          queryClient.setQueryData(['user'], user);
        }

          const { locale: validatedLocale, rawLocale } = getBrowserLocaleAndTimezone();

          if(!user){
            navigate("/auth", { replace: true });
            return;
          }
  
          // 1) One request: profile + current scenario (join)
          const profileCtx = await queryClient.fetchQuery({
            queryKey: ['profile'],
            queryFn: fetchProfile,
            staleTime: 0,
          });
  
          if (!profileCtx) {
            await reportErrorToTelegram({
              action: 'readProfileContextAfterOAuth',
              error: new Error('Failed to fetch profile'),
              userId: user.id,
            });
            navigate('/auth', { replace: true, state: { error: 'profile_read_failed' } });
            return;
          }
  
          // 2) Language: from profile or browser + save to profile
          let normalizedLang: 'ru' | 'en';
  
          if (profileCtx.language) {
            normalizedLang = profileCtx.language.toLowerCase() === 'ru' ? 'ru' : 'en';
          } else {
            normalizedLang = detectInterfaceLanguage(rawLocale);
  
            const { error: profileLangError } = await supabase
              .from('profiles')
              .update({ language: normalizedLang })
  
            if (profileLangError) {
              await reportErrorToTelegram({
                action: 'saveLanguageToProfile',
                error: profileLangError,
                userId: user.id,
                context: { language: normalizedLang },
              });
            } else {
              queryClient.setQueryData(['profile'], (old: typeof profileCtx) => {
                if (!old) return old;
                return {
                  ...old,
                  language: normalizedLang,
                };
              });
              // Also invalidate the language hook cache
              queryClient.invalidateQueries({ queryKey: ['language'] });
            }
          }
  
          changeLanguage(normalizedLang);

  
          // 4) NEW USER / FIRST SCENARIO checks
          const isNewUser = profileCtx.created_at
            ? new Date(profileCtx.created_at).getTime() > Date.now() - 5 * 60 * 1000
            : false;
  
          // 5) If new user - show currency modal
          if (isNewUser) {
            let suggestedCurrency: CurrencyCode = DEFAULT_CURRENCY;
            const localeLower = validatedLocale.toLowerCase();
  
            if (localeLower.includes('ru')) suggestedCurrency = 'RUB';
            else if (localeLower.includes('th')) suggestedCurrency = 'THB';
            else if (localeLower.includes('gb') || localeLower.includes('uk')) suggestedCurrency = 'GBP';
            else if (localeLower.includes('jp')) suggestedCurrency = 'JPY';
            else if (localeLower.includes('cn')) suggestedCurrency = 'CNY';
            else if (localeLower.includes('kr')) suggestedCurrency = 'KRW';
            else if (
              localeLower.includes('eu') ||
              localeLower.includes('de') ||
              localeLower.includes('fr') ||
              localeLower.includes('es') ||
              localeLower.includes('it')
            ) suggestedCurrency = 'EUR';
  
            setPendingScenarioId(profileCtx.current_scenario_id);
            setPendingScenarioSlug(profileCtx.current_scenario_slug);
            setPendingUserId(user.id);
            setSelectedCurrency(suggestedCurrency);
            setShowCurrencyModal(true);
            return;
          }
  
          navigate(`/${profileCtx.current_scenario_slug}/income`, { replace: true });
        } catch (error) {
          await reportErrorToTelegram({
            action: 'unexpectedError',
            error: error as Error,
            context: { message: 'Unexpected error in AuthCallback' },
          });
          navigate('/auth', { replace: true, state: { error: 'unexpected_error' } });
        }
      })();
    }, [navigate, location.pathname, location.search, changeLanguage]);
  

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
      } else {
        queryClient.setQueryData(['profile'], (old: Profile | undefined) => {
          if (!old || !old.current_scenario) return old;
          return {
            ...old,
            current_scenario: {
              ...old.current_scenario,
              base_currency: selectedCurrency,
            },
          };
        });
        
        queryClient.setQueryData(['scenarios', 'current'], (old: CurrentScenario | undefined) => {
          if (!old) return old;
          return {
            ...old,
            baseCurrency: selectedCurrency,
          };
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