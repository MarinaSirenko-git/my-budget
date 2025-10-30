import { useTheme } from '@/shared/store/theme';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

export default function ThemeSwitch() {
  const { theme, toggle } = useTheme();
  return (
    <button className="btn btn-sm" onClick={toggle}>
      {theme === 'light' ? <MoonIcon className="w-5 h-5" style={{color: '#1E293B'}} /> : <SunIcon className="w-5 h-5" style={{ color: '#F8FAFC' }} />}
    </button>
  );
}