import { useTranslation } from '@/shared/i18n';

export default function DocsPage() {
  const { t } = useTranslation('pages');

  return (
    <div className="flex flex-col lg:p-6 max-w-4xl mx-auto bg-white dark:bg-black">
      <header className="border border-black dark:border-white p-6 lg:p-8 mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-black dark:text-white mb-4 tracking-tight">{t('docs.header.title')}</h1>
        <div className="h-px bg-black dark:bg-white mb-4"></div>
        <h2 className="text-lg lg:text-xl font-bold text-black dark:text-white mb-4 tracking-tight">{t('docs.header.subtitle')}</h2>
        <p className="text-sm lg:text-base text-black dark:text-white leading-relaxed font-light">{t('docs.header.description')}</p>
      </header>

      <section className="border border-black dark:border-white p-6 lg:p-8 mb-6 lg:mb-8">
        <h2 className="text-lg lg:text-xl font-bold text-black dark:text-white mb-4 tracking-tight">{t('docs.alwaysAvailable.title')}</h2>
        <div className="h-px bg-black dark:bg-white mb-4"></div>
        <p className="text-sm lg:text-base text-black dark:text-white leading-relaxed font-light">{t('docs.alwaysAvailable.description')}</p>
      </section>

      <section className="border border-black dark:border-white p-6 lg:p-8 mb-6 lg:mb-8">
        <h2 className="text-lg lg:text-xl font-bold text-black dark:text-white mb-4 tracking-tight">{t('docs.whatAppDoes.title')}</h2>
        <div className="h-px bg-black dark:bg-white mb-4"></div>
        <ul className="list-none space-y-3 text-sm lg:text-base text-black dark:text-white font-light">
          <li className="before:content-['—'] before:mr-2">
            <strong className="font-bold">{t('docs.whatAppDoes.item1.title')}</strong> {t('docs.whatAppDoes.item1.description')}
          </li>
          <li className="before:content-['—'] before:mr-2">
            <strong className="font-bold">{t('docs.whatAppDoes.item2.title')}</strong> {t('docs.whatAppDoes.item2.description')}
          </li>
          <li className="before:content-['—'] before:mr-2">
            <strong className="font-bold">{t('docs.whatAppDoes.item3.title')}</strong> {t('docs.whatAppDoes.item3.description')}
          </li>
          <li className="before:content-['—'] before:mr-2">
            <strong className="font-bold">{t('docs.whatAppDoes.item4.title')}</strong> {t('docs.whatAppDoes.item4.description')}
          </li>
        </ul>
      </section>
    </div>
  );
}

