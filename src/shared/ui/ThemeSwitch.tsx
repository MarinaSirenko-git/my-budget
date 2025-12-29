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
      className="relative flex items-center w-20 h-10 border border-black dark:border-white bg-white dark:bg-black p-1 transition-colors focus:outline-none focus:ring-0"
      aria-label={isLight ? t('header.switchToDarkMode') : t('header.switchToLightMode')}
      role="switch"
      aria-checked={!isLight}
    >
      {/* Background icons - always visible */}
      <div className="flex items-center justify-between w-full h-full pointer-events-none z-0">
        <div className="flex items-center justify-center w-1/2 h-full">
          <SunIcon className="w-5 h-5 text-black dark:text-white" />
        </div>
        <div className="flex items-center justify-center w-1/2 h-full">
          <MoonIcon className="w-5 h-5 text-black dark:text-white" />
        </div>
      </div>

      {/* Sliding selector */}
      <div
        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] border border-black dark:border-white bg-black dark:bg-white transition-transform duration-300 ease-in-out flex items-center justify-center z-10 ${
          isLight ? 'left-1' : 'right-1'
        }`}
      >
        {isLight ? (
          <SunIcon className="w-5 h-5 text-white dark:text-black" />
        ) : (
          <MoonIcon className="w-5 h-5 text-white dark:text-black" />
        )}
      </div>
    </button>
  );
}