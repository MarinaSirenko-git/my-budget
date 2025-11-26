import { supabase } from '@/lib/supabase';
import { useTranslation } from '@/shared/i18n';
import TextButton from '@/shared/ui/atoms/TextButton';
import { reportErrorToTelegram } from '@/shared/utils/errorReporting';

export default function AuthPage() {
  const { t } = useTranslation('pages');

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth-callback`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      }
    });
    
    if (error) {
      await reportErrorToTelegram({
        action: 'signInWithGoogle',
        error: error,
        context: { provider: 'google' },
      });
    }
  };

  return (
    <div className="flex h-screen w-full">
      <div className="flex-1 bg-black dark:bg-black">
        <img src="/src/assets/auth-page-mouse1.webp" alt="Auth Background" className="w-full h-full object-contain" />
      </div>
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-white">
        <div className="flex flex-col items-center gap-6 p-8">
          <p className="text-3xl font-bold">{t('auth.appName')}</p>
          <p className="text-md text-textColor text-center max-w-[450px]">
            {t('auth.description')}
          </p>
          <TextButton
            onClick={handleGoogleLogin}
            variant="primary"
            aria-label={t('auth.signInWithGoogleAriaLabel')}
            className="min-w-[200px]"
          >
            {t('auth.signInWithGoogle')}
          </TextButton>
        </div>
      </div>
    </div>
  );
}
