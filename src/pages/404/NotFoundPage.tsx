import { useTranslation } from '@/shared/i18n';

export default function NotFoundPage() {
  const { t } = useTranslation('pages');
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-4 lg:p-6">
      <h1 className="text-xl lg:text-2xl font-semibold text-mainTextColor dark:text-mainTextColor mb-2 text-center px-4">
        {t('notFound.title')}
      </h1>
      <p className="text-sm lg:text-base text-textColor dark:text-textColor text-center px-4">
        {t('notFound.message')}
      </p>
    </div>
  );
}
