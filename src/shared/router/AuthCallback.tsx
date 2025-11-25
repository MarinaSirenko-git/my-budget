import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useTranslation, useLanguage } from '@/shared/i18n';
import { useAuth } from '@/shared/store/auth';
import { createSlug } from '@/shared/utils/slug';

/**
 * Валидирует и нормализует locale
 */
function validateAndNormalizeLocale(locale: string | undefined): string {
  if (!locale || typeof locale !== 'string') {
    return 'en-US';
  }

  // Базовая валидация формата locale (например: en, en-US, ru-RU)
  const localePattern = /^[a-z]{2}(-[A-Z]{2})?$/i;
  if (localePattern.test(locale)) {
    return locale;
  }

  // Пытаемся извлечь язык из некорректного формата
  const langMatch = locale.match(/^([a-z]{2})/i);
  if (langMatch) {
    const lang = langMatch[1].toLowerCase();
    // Маппинг популярных языков
    const langMap: Record<string, string> = {
      ru: 'ru-RU',
      en: 'en-US',
      de: 'de-DE',
      fr: 'fr-FR',
      es: 'es-ES',
      it: 'it-IT',
      pt: 'pt-BR',
      ja: 'ja-JP',
      zh: 'zh-CN',
      ko: 'ko-KR',
    };
    return langMap[lang] || 'en-US';
  }

  return 'en-US';
}

/**
 * Валидирует timezone
 */
function validateTimezone(timezone: string | undefined): string {
  if (!timezone || typeof timezone !== 'string') {
    return 'UTC';
  }

  // Ограничение длины для предотвращения DoS
  if (timezone.length > 100) {
    console.warn('Timezone too long, using UTC');
    return 'UTC';
  }

  // Базовая проверка формата timezone (например: America/New_York, Europe/London)
  const timezonePattern = /^[A-Za-z_]+\/[A-Za-z_]+$/;
  if (timezonePattern.test(timezone) || timezone === 'UTC') {
    return timezone;
  }

  return 'UTC';
}

/**
 * Определяет язык интерфейса из navigator.language
 * Маппит на поддерживаемые языки (ru, en)
 */
function detectInterfaceLanguage(browserLang: string): 'ru' | 'en' {
  const langCode = browserLang.toLowerCase().split('-')[0];
  
  // Прямое совпадение
  if (langCode === 'ru' || langCode === 'en') {
    return langCode;
  }
  
  // Маппинг языков стран СНГ и близких регионов на русский
  const russianSpeakingRegions = ['uk', 'be', 'kk', 'ky', 'uz', 'az', 'hy', 'ka', 'ro', 'bg', 'sr', 'mk'];
  if (russianSpeakingRegions.includes(langCode)) {
    return 'ru';
  }
  
  // По умолчанию английский для всех остальных
  return 'en';
}

/**
 * Ожидает создания сценария триггером с retry логикой
 * @param userId ID пользователя
 * @param maxRetries Максимальное количество попыток
 * @param retryDelay Задержка между попытками в мс
 * @returns ID сценария или null
 */
async function waitForScenarioCreation(
  userId: string,
  maxRetries: number = 5,
  retryDelay: number = 500
): Promise<string | null> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('current_scenario_id')
      .eq('id', userId)
      .single();

    if (!error && profile?.current_scenario_id) {
      return profile.current_scenario_id;
    }

    // Если это не последняя попытка, ждем перед следующей
    if (attempt < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  // Если сценарий все еще не создан, проверяем, есть ли хотя бы один сценарий у пользователя
  const { data: scenarios, error: scenariosError } = await supabase
    .from('scenarios')
    .select('id')
    .eq('user_id', userId)
    .limit(1);

  if (!scenariosError && scenarios && scenarios.length > 0) {
    // Есть сценарий, но current_scenario_id не установлен - устанавливаем его
    const scenarioId = scenarios[0].id;
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ current_scenario_id: scenarioId })
      .eq('id', userId);

    if (!updateError) {
      return scenarioId;
    }
  }

  return null;
}

/**
 * Получает slug сценария по его ID
 */
async function getScenarioSlug(scenarioId: string, userId: string): Promise<string | null> {
  const { data: scenario, error } = await supabase
    .from('scenarios')
    .select('name')
    .eq('id', scenarioId)
    .eq('user_id', userId)
    .single();

  if (error || !scenario?.name) {
    return null;
  }

  return createSlug(scenario.name);
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const { t } = useTranslation('pages');
  const { changeLanguage } = useLanguage();
  const { loadCurrentScenarioId, loadCurrentScenarioSlug } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        // Проверяем, есть ли код авторизации в URL
        // Supabase может передавать код в query параметрах или в hash (PKCE flow)
        const url = new URL(window.location.href);
        const searchParams = url.searchParams;
        const hashParams = new URLSearchParams(url.hash.substring(1)); // Убираем # и парсим hash
        
        const hasCode = searchParams.has('code') || hashParams.has('code');
        const hasError = searchParams.has('error') || hashParams.has('error');
        
        // Если есть ошибка в URL, редиректим на auth
        if (hasError) {
          const error = searchParams.get('error') || hashParams.get('error');
          const errorDescription = searchParams.get('error_description') || hashParams.get('error_description');
          console.error('Auth error in URL:', error, errorDescription);
          navigate('/auth', { replace: true, state: { error } });
          return;
        }
        
        let user = null;
        
        if (hasCode) {
          // Если есть код, обмениваем его на сессию
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (exchangeError) {
            console.error('Error exchanging code for session:', exchangeError);
            // Если ошибка критическая, редиректим на auth
            if (exchangeError.message.includes('invalid request')) {
              console.log('No valid auth code in URL, checking existing session...');
            } else {
              navigate('/auth', { replace: true });
              return;
            }
          } else if (data?.user) {
            console.log('Session established from code:', data);
            user = data.user;
            debugger
            // Очищаем URL от параметров авторизации
            window.history.replaceState({}, document.title, '/auth-callback');
          }
        } else {
          console.log('No auth code in URL, checking existing session...');
        }

        // Если пользователь еще не получен, проверяем существующую сессию
        if (!user) {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) {
            console.error('Error getting session:', sessionError);
            navigate('/auth', { replace: true });
            return;
          }
          
          if (session?.user) {
            user = session.user;
            console.log('Using existing session');
          } else {
            // Пытаемся получить пользователя напрямую
            const { data: { user: userData }, error: userError } = await supabase.auth.getUser();
            if (userError || !userData) {
              console.error('No user found, redirecting to auth');
              navigate('/auth', { replace: true });
              return;
            }
            user = userData;
          }
        }

        // Финальная проверка пользователя
        if (!user) {
          console.error('No user found after all attempts');
          navigate('/auth', { replace: true });
          return;
        }

        // Валидация и нормализация locale и timezone
        let tz: string;
        let loc: string;

        try {
          tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          loc = navigator.language || 'en-US';
        } catch (intlError) {
          console.warn('Error getting Intl options, using defaults:', intlError);
          tz = 'UTC';
          loc = 'en-US';
        }

        const validatedTimezone = validateTimezone(tz);
        const validatedLocale = validateAndNormalizeLocale(loc);

        // Определяем язык интерфейса из браузера
        const interfaceLanguage = detectInterfaceLanguage(loc);
        
        // Проверяем, есть ли уже сохраненный язык в localStorage или профиле
        const savedLanguage = localStorage.getItem('user_language');
        let languageToUse = savedLanguage || interfaceLanguage;
        
        // Нормализуем язык (ru/en)
        const normalizedLang = languageToUse.toLowerCase() === 'ru' ? 'ru' : 'en';
        
        // Устанавливаем язык интерфейса в i18n и localStorage
        changeLanguage(normalizedLang);
        localStorage.setItem('user_language', normalizedLang);

        // Обновляем метаданные пользователя (это может запустить триггер создания сценария)
        // const { error: updateError } = await supabase.auth.updateUser({
        //   data: { timezone: validatedTimezone, locale: validatedLocale }
        // });
        // debugger
        // if (updateError) {
        //   debugger
        //   console.error('Error updating user metadata:', updateError);
        //   // Продолжаем выполнение, это не критично
        // }

        // Сохраняем язык в профиль пользователя (если еще не сохранен)
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('language')
          .eq('id', user.id)
          .single();
        
        if (!existingProfile?.language) {
          const { error: profileLangError } = await supabase
            .from('profiles')
            .update({ language: normalizedLang })
            .eq('id', user.id);
          
          if (profileLangError) {
            console.error('Error saving language to profile:', profileLangError);
          } else {
            console.log('Language saved to profile:', normalizedLang);
          }
        }

        // Ожидаем создания сценария триггером (если его еще нет)
        let currentScenarioId: string | null = null;
        
        // Сначала пытаемся загрузить через store
        await loadCurrentScenarioId();
        const authState = useAuth.getState();
        currentScenarioId = authState.currentScenarioId;

        // Если сценарий не найден, ждем его создания
        if (!currentScenarioId) {
          console.log('Scenario not found, waiting for trigger to create it...');
          currentScenarioId = await waitForScenarioCreation(user.id);
          
          if (currentScenarioId) {
            // Обновляем store после получения сценария
            await loadCurrentScenarioId();
          }
        }

        // Если сценарий все еще не найден, это критическая ошибка
        if (!currentScenarioId) {
          console.error('Failed to get or create scenario for user');
          // Редиректим на страницу авторизации с сообщением об ошибке
          navigate('/auth', { replace: true, state: { error: 'scenario_creation_failed' } });
          return;
        }

        // Загружаем slug для сценария
        await loadCurrentScenarioSlug();
        let currentScenarioSlug = useAuth.getState().currentScenarioSlug;

        // Если slug не загружен, получаем его напрямую
        if (!currentScenarioSlug) {
          currentScenarioSlug = await getScenarioSlug(currentScenarioId, user.id);
          if (currentScenarioSlug) {
            // Обновляем store
            await loadCurrentScenarioSlug();
          }
        }

        // Устанавливаем валюту через RPC с обработкой ошибок
        const { error: rpcError } = await supabase.rpc('set_currency_from_client', {
          p_timezone: validatedTimezone,
          p_locale: validatedLocale
        });

        if (rpcError) {
          console.error('Error setting currency from client:', rpcError);
          // Fallback: устанавливаем дефолтную валюту USD в текущий сценарий
          const { error: fallbackError } = await supabase
            .from('scenarios')
            .update({ base_currency: 'USD' })
            .eq('id', currentScenarioId)
            .eq('user_id', user.id);

          if (fallbackError) {
            console.error('Error setting fallback currency:', fallbackError);
          } else {
            console.log('Fallback currency USD set successfully');
            localStorage.setItem('user_currency', 'USD');
          }
        } else {
          console.log('Currency set successfully from timezone/locale');
        }

        // Редирект на страницу целей сценария
        if (currentScenarioSlug) {
          navigate(`/${currentScenarioSlug}/goals`, { replace: true });
        } else {
          // Если slug все еще не получен, получаем имя сценария напрямую
          const { data: scenario, error: scenarioError } = await supabase
            .from('scenarios')
            .select('name')
            .eq('id', currentScenarioId)
            .eq('user_id', user.id)
            .single();

          if (!scenarioError && scenario?.name) {
            const slug = createSlug(scenario.name);
            
            navigate(`/${slug}/goals`, { replace: true });
          } else {
            // Критическая ошибка - не можем получить данные сценария
            console.error('Failed to get scenario data for redirect');
            navigate('/auth', { replace: true, state: { error: 'scenario_data_failed' } });
          }
        }
      } catch (error) {
        console.error('Unexpected error in AuthCallback:', error);
        navigate('/auth', { replace: true, state: { error: 'unexpected_error' } });
      }
    })();
  }, [navigate, loadCurrentScenarioId, loadCurrentScenarioSlug, changeLanguage]);

  return <p>{t('auth.signingIn')}</p>;
}