import { useTheme } from '@/shared/store/theme';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

export default function ThemeSwitch() {
  const { theme, toggle } = useTheme();
  return (
    <button className="text-sm" onClick={toggle}>
      {theme === 'light' ? <div className='text-[#1E293B] dark:text-white flex items-center gap-2'><MoonIcon className="w-5 h-5" style={{color: '#1E293B'}} />Turn on Dark Theme</div> : <div className='text-[#F8FAFC] dark:text-white flex items-center gap-2'><SunIcon className="w-5 h-5" style={{ color: '#F8FAFC' }} />Turn on Light Theme</div>}
    </button>
  );
}