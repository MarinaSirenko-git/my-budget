import { useTranslation } from '@/shared/i18n';

export default function NotFoundPage() {
  const { t } = useTranslation('pages');
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-6">
      <h1 className="text-2xl font-semibold text-mainTextColor dark:text-mainTextColor mb-2">
        {t('notFound.title')}
      </h1>
      <p className="text-textColor dark:text-textColor">
        {t('notFound.message')}
      </p>
    </div>
  );
}
