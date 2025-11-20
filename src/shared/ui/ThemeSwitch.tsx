import { useTheme } from '@/shared/store/theme';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '@/shared/i18n';

export default function ThemeSwitch() {
  const { theme, toggle } = useTheme();
  const { t } = useTranslation('components');
  const isLight = theme === 'light';

  return (
    <button
      onClick={toggle}
      className="relative flex items-center w-20 h-10 rounded-full bg-primary dark:bg-cardColor p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      aria-label={isLight ? t('header.switchToDarkMode') : t('header.switchToLightMode')}
      role="switch"
      aria-checked={!isLight}
    >
      {/* Background icons - always visible */}
      <div className="flex items-center justify-between w-full px-2 pointer-events-none z-0">
        <SunIcon className="w-5 h-5 text-mainTextColor" />
        <MoonIcon className="w-5 h-5 text-white" />
      </div>

      {/* Sliding circular selector */}
      <div
        className={`absolute top-1 w-8 h-8 rounded-full bg-cardColor dark:bg-sidebarBg shadow-md transition-transform duration-300 ease-in-out flex items-center justify-center z-10 ${
          isLight ? 'left-1' : 'left-11'
        }`}
      >
        {isLight ? (
          <SunIcon className="w-5 h-5 text-mainTextColor" />
        ) : (
          <MoonIcon className="w-5 h-5 text-mainTextColor" />
        )}
      </div>
    </button>
  );
}