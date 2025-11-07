import TextButton from '@/shared/ui/atoms/TextButton';
import Logo from '@/shared/ui/Logo';
import { supabase } from '@/lib/supabase'

export default function AuthPage() {
  const handleGoogleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth-callback`,
        queryParams: { access_type: 'offline', prompt: 'consent' }
      }
    })
      if (error) console.error('Error signing in with Google:', error);
      if (data) console.log('Data:', data);
  };

  return (
    <div className="flex h-screen w-full">
      {/* Left section - Image placeholder */}
      <div className="flex-1 bg-black">
        {/* Image will be added here later */}
      </div>

      {/* Right section - Login form */}
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="flex flex-col items-center gap-6 p-8">
          <Logo asLink={false} iconSize="lg" textSize="text-3xl" />
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
