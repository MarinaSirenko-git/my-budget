import { useTranslation } from '@/shared/i18n';

export default function DocsPage() {
  const { t } = useTranslation('pages');

  return (
    <div className="flex flex-col lg:p-6 max-w-4xl mx-auto">
      <header className="mb-4 lg:mb-8">
        <h1 className="text-xl lg:text-2xl font-bold text-primary mb-2 lg:mb-4">{t('docs.header.title')}</h1>
        <p className="text-sm lg:text-base text-mainTextColor dark:text-mainTextColor" dangerouslySetInnerHTML={{ __html: t('docs.header.description') }} />
      </header>

      <section className="space-y-2 mb-4 lg:mb-8">
        <h2 className="text-base lg:text-lg font-semibold text-mainTextColor dark:text-mainTextColor">{t('docs.section1.title')}</h2>
        <p className="text-sm lg:text-base text-mainTextColor dark:text-mainTextColor"><strong>{t('docs.labels.why')}</strong> {t('docs.section1.why')}</p>
        <p className="text-sm lg:text-base text-mainTextColor dark:text-mainTextColor"><strong>{t('docs.labels.what')}</strong> {t('docs.section1.what')}</p>
        <p className="text-sm lg:text-base text-mainTextColor dark:text-mainTextColor"><strong>{t('docs.labels.result')}</strong> {t('docs.section1.result')}</p>
        <div className="mt-4">
          <h3 className="text-base lg:text-lg font-medium text-mainTextColor dark:text-mainTextColor mb-2">{t('docs.section1.inAppTitle')}</h3>
          <ul className="list-disc list-inside space-y-2 text-sm lg:text-base text-mainTextColor dark:text-mainTextColor">
            <li>{t('docs.section1.inAppItem1')}</li>
            <li>{t('docs.section1.inAppItem2')}</li>
          </ul>
        </div>
      </section>

      <section className="space-y-2 mb-4 lg:mb-8">
        <h2 className="text-base lg:text-lg font-semibold text-mainTextColor dark:text-mainTextColor">{t('docs.section2.title')}</h2>
        <p className="text-sm lg:text-base text-mainTextColor dark:text-mainTextColor"><strong>{t('docs.labels.why')}</strong> {t('docs.section2.why')}</p>
        <p className="text-sm lg:text-base text-mainTextColor dark:text-mainTextColor"><strong>{t('docs.labels.what')}</strong> {t('docs.section2.what')}</p>
        <p className="text-sm lg:text-base text-mainTextColor dark:text-mainTextColor"><strong>{t('docs.labels.result')}</strong> {t('docs.section2.result')}</p>
        <div className="mt-4">
          <h3 className="text-base lg:text-lg font-medium text-mainTextColor dark:text-mainTextColor mb-2">{t('docs.section2.inAppTitle')}</h3>
          <ul className="list-disc list-inside space-y-2 text-sm lg:text-base text-mainTextColor dark:text-mainTextColor">
            <li>{t('docs.section2.inAppItem1')}</li>
            <li>{t('docs.section2.inAppItem2')}</li>
          </ul>
        </div>
      </section>

      <section className="space-y-2 mb-4 lg:mb-8">
        <h2 className="text-base lg:text-lg font-semibold text-mainTextColor dark:text-mainTextColor">{t('docs.section3.title')}</h2>
        <p className="text-sm lg:text-base text-mainTextColor dark:text-mainTextColor"><strong>{t('docs.labels.why')}</strong> {t('docs.section3.why')}</p>
        <p className="text-sm lg:text-base text-mainTextColor dark:text-mainTextColor"><strong>{t('docs.labels.what')}</strong> {t('docs.section3.what')}</p>
        <p className="text-sm lg:text-base text-mainTextColor dark:text-mainTextColor"><strong>{t('docs.labels.result')}</strong> {t('docs.section3.result')}</p>
        <div className="mt-4">
          <h3 className="text-base lg:text-lg font-medium text-mainTextColor dark:text-mainTextColor mb-2">{t('docs.section3.inAppTitle')}</h3>
          <ul className="list-disc list-inside space-y-2 text-sm lg:text-base text-mainTextColor dark:text-mainTextColor">
            <li>{t('docs.section3.inAppItem1')}</li>
            <li>{t('docs.section3.inAppItem2')}</li>
          </ul>
        </div>
      </section>

      <section className="space-y-2 mb-4 lg:mb-8">
        <h2 className="text-base lg:text-lg font-semibold text-mainTextColor dark:text-mainTextColor">{t('docs.section4.title')}</h2>
        <p className="text-sm lg:text-base text-mainTextColor dark:text-mainTextColor"><strong>{t('docs.labels.why')}</strong> {t('docs.section4.why')}</p>
        <p className="text-sm lg:text-base text-mainTextColor dark:text-mainTextColor"><strong>{t('docs.labels.how')}</strong> {t('docs.section4.how')}</p>
        <p className="text-sm lg:text-base text-mainTextColor dark:text-mainTextColor"><strong>{t('docs.labels.result')}</strong> {t('docs.section4.result')}</p>
        <div className="mt-4">
          <h3 className="text-base lg:text-lg font-medium text-mainTextColor dark:text-mainTextColor mb-2">{t('docs.section4.inAppTitle')}</h3>
          <ul className="list-disc list-inside space-y-2 text-sm lg:text-base text-mainTextColor dark:text-mainTextColor">
            <li>{t('docs.section4.inAppItem1')}</li>
            <li>{t('docs.section4.inAppItem2')}</li>
            <li>{t('docs.section4.inAppItem3')}</li>
          </ul>
        </div>
      </section>

      <section className="space-y-2 mb-4 lg:mb-8">
        <h2 className="text-base lg:text-lg font-semibold text-mainTextColor dark:text-mainTextColor">{t('docs.whyItHelps.title')}</h2>
        <ul className="list-disc list-inside space-y-2 text-sm lg:text-base text-mainTextColor dark:text-mainTextColor">
          <li>{t('docs.whyItHelps.item1')}</li>
          <li>{t('docs.whyItHelps.item2')}</li>
          <li>{t('docs.whyItHelps.item3')}</li>
          <li>{t('docs.whyItHelps.item4')}</li>
          <li>{t('docs.whyItHelps.item5')}</li>
        </ul>
      </section>

      <section className="space-y-2 mb-4 lg:mb-8">
        <h2 className="text-base lg:text-lg font-semibold text-mainTextColor dark:text-mainTextColor">{t('docs.whatAppDoes.title')}</h2>
        <ul className="list-disc list-inside space-y-2 text-sm lg:text-base text-mainTextColor dark:text-mainTextColor">
          <li>{t('docs.whatAppDoes.item1')}</li>
          <li>{t('docs.whatAppDoes.item2')}</li>
          <li>{t('docs.whatAppDoes.item3')}</li>
          <li>{t('docs.whatAppDoes.item4')}</li>
          <li>{t('docs.whatAppDoes.item5')}</li>
        </ul>
      </section>

      <section className="space-y-2 mb-4 lg:mb-8">
        <h2 className="text-base lg:text-lg font-semibold text-mainTextColor dark:text-mainTextColor">{t('docs.howToUse.title')}</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm lg:text-base text-mainTextColor dark:text-mainTextColor">
          <li>{t('docs.howToUse.item1')}</li>
          <li>{t('docs.howToUse.item2')}</li>
          <li>{t('docs.howToUse.item3')}</li>
          <li>{t('docs.howToUse.item4')}</li>
          <li>{t('docs.howToUse.item5')}</li>
        </ol>
      </section>

      <section className="space-y-2 mb-4 lg:mb-8">
        <h2 className="text-base lg:text-lg font-semibold text-mainTextColor dark:text-mainTextColor">{t('docs.faq.title')}</h2>
        <div className="space-y-3">
          <details className="text-sm lg:text-base text-mainTextColor dark:text-mainTextColor">
            <summary className="cursor-pointer font-medium">{t('docs.faq.q1')}</summary>
            <p className="mt-2 ml-4">{t('docs.faq.a1')}</p>
          </details>
          <details className="text-sm lg:text-base text-mainTextColor dark:text-mainTextColor">
            <summary className="cursor-pointer font-medium">{t('docs.faq.q2')}</summary>
            <p className="mt-2 ml-4">{t('docs.faq.a2')}</p>
          </details>
          <details className="text-sm lg:text-base text-mainTextColor dark:text-mainTextColor">
            <summary className="cursor-pointer font-medium">{t('docs.faq.q3')}</summary>
            <p className="mt-2 ml-4">{t('docs.faq.a3')}</p>
          </details>
        </div>
      </section>
    </div>
  );
}

