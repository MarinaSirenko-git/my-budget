import { useTranslation } from '@/shared/i18n';

export default function NotFoundPage() {
  const { t } = useTranslation('pages');
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-4 lg:p-6 bg-white dark:bg-black">
      <div className="border border-black dark:border-white p-8 lg:p-12 max-w-md w-full">
        <h1 className="text-2xl lg:text-3xl font-bold text-black dark:text-white mb-4 text-center tracking-tight">
          {t('notFound.title')}
        </h1>
        <div className="h-px bg-black dark:bg-white mb-6"></div>
        <p className="text-sm lg:text-base text-black dark:text-white text-center leading-relaxed font-light">
          {t('notFound.message')}
        </p>
      </div>
    </div>
  );
}
