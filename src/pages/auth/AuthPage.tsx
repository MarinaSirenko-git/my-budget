import TextButton from '@/shared/ui/atoms/TextButton';
import { supabase } from '@/lib/supabase'

export default function AuthPage() {
  const handleGoogleLogin = async () => {

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth-callback`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      }
    })
      if (error) console.error('Error signing in with Google:', error);
      if (data) console.log('Data:', data);
  };

  return (
    <div className="flex h-screen w-full">
      {/* Left section - Image placeholder */}
      <div className="flex-1 bg-black dark:bg-black">
        <img src="/src/assets/auth-page-mouse1.webp" alt="Auth Background" className="w-full h-full object-contain" />
      </div>


      {/* Right section - Login form */}
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-white">
        <div className="flex flex-col items-center gap-6 p-8">
          <p className="text-3xl font-bold">Mousie</p>
          <p className="text-md text-textColor text-center max-w-[450px]">
           Добавляйте доходы, планируемые расходы и цели, чтобы управлять семейным бюджетом. Просто и эффективно.
          </p>
          <TextButton
            onClick={handleGoogleLogin}
            variant="primary"
            aria-label="Войти через Google"
            className="min-w-[200px]"
          >
            Войти через Google
          </TextButton>
        </div>
      </div>
    </div>
  );
}
