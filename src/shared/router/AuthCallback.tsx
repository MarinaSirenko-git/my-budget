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

export default function AuthCallback() {
  const navigate = useNavigate();
  const { t } = useTranslation('pages');
  const { changeLanguage } = useLanguage();
  const { loadCurrentScenarioId, loadCurrentScenarioSlug } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        // Обмен кода на сессию
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (exchangeError) {
          console.error('Error exchanging code for session:', exchangeError);
          // Продолжаем выполнение, возможно сессия уже установлена
        }
        if (data) {
          console.log('Session established:', data);
        }

        // Получаем пользователя
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) {
          console.error('Error getting user:', userError);
          navigate('/auth', { replace: true });
          return;
        }
        if (!user) {
          console.error('No user found');
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

        // Обновляем метаданные пользователя
        const { error: updateError } = await supabase.auth.updateUser({
          data: { timezone: validatedTimezone, locale: validatedLocale }
        });
        if (updateError) {
          console.error('Error updating user metadata:', updateError);
          // Продолжаем выполнение, это не критично
        }

        // Сохраняем язык в профиль пользователя (если еще не сохранен)
        // Это нужно для синхронизации между устройствами
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('language')
          .eq('id', user.id)
          .single();
        
        if (!existingProfile?.language) {
          // Если язык еще не установлен в профиле, сохраняем его
          const { error: profileLangError } = await supabase
            .from('profiles')
            .update({ language: normalizedLang })
            .eq('id', user.id);
          
          if (profileLangError) {
            console.error('Error saving language to profile:', profileLangError);
            // Не критично, продолжаем выполнение
          } else {
            console.log('Language saved to profile:', normalizedLang);
          }
        }

        // Загружаем текущий сценарий перед установкой валюты
        await loadCurrentScenarioId();
        await loadCurrentScenarioSlug();

        const authState = useAuth.getState();
        const currentScenarioId = authState.currentScenarioId;

        // Устанавливаем валюту через RPC с обработкой ошибок
        const { error: rpcError } = await supabase.rpc('set_currency_from_client', {
          p_timezone: validatedTimezone,
          p_locale: validatedLocale
        });

        if (rpcError) {
          console.error('Error setting currency from client:', rpcError);
          // Fallback: устанавливаем дефолтную валюту USD в текущий сценарий
          if (currentScenarioId) {
            const { error: fallbackError } = await supabase
              .from('scenarios')
              .update({ base_currency: 'USD' })
              .eq('id', currentScenarioId)
              .eq('user_id', user.id);

            if (fallbackError) {
              console.error('Error setting fallback currency:', fallbackError);
              // Продолжаем выполнение, валюта может быть установлена позже
            } else {
              console.log('Fallback currency USD set successfully');
              // Синхронизируем с localStorage
              localStorage.setItem('user_currency', 'USD');
            }
          }
        } else {
          console.log('Currency set successfully from timezone/locale');
        }

        // Получаем текущий сценарий для редиректа
        const authStateForRedirect = useAuth.getState();
        const currentScenarioSlug = authStateForRedirect.currentScenarioSlug;

        if (currentScenarioId && currentScenarioSlug) {
          navigate(`/${currentScenarioSlug}/goals`, { replace: true });
        } else if (currentScenarioId) {
          // Если slug не загружен, получаем имя сценария
          const { data: scenario, error: scenarioError } = await supabase
            .from('scenarios')
            .select('name')
            .eq('id', currentScenarioId)
            .eq('user_id', user.id)
            .single();

          if (!scenarioError && scenario) {
            const slug = createSlug(scenario.name);
            navigate(`/${slug}/goals`, { replace: true });
          } else {
            navigate('/scenario/goals', { replace: true });
          }
        } else {
          navigate('/scenario/goals', { replace: true });
        }
      } catch (error) {
        console.error('Unexpected error in AuthCallback:', error);
        // Редирект на страницу авторизации при критической ошибке
        navigate('/auth', { replace: true });
      }
    })();
  }, [navigate, loadCurrentScenarioId, loadCurrentScenarioSlug]);

  return <p>{t('auth.signingIn')}</p>;
}