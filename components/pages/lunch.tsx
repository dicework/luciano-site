import { getTranslator, type Locale } from '@/i18n';
import { localizedMetadata } from '@/i18n/metadata';
import type { Metadata } from 'next';
import { PageHeading } from '@/components/site/section-heading';
import { LunchMenu } from '@/components/lunch/lunch-menu';

export function pageMetadata(locale: Locale): Metadata {
  const t = getTranslator(locale);
  const meta = {
    title: t('Седмично обедно меню'),
    description: t(
      'Обедните предложения на Лучиано във Варна. Разгледайте менюто по дни и подгответе поръчка по WhatsApp или Viber.',
    ),
    alternates: { canonical: '/lunch/' },
  };
  return localizedMetadata(meta, locale);
}

export default function LunchPage({ locale = 'bg' }: { locale?: Locale }) {
  const t = getTranslator(locale);
  return (
    <main id="main">
      <PageHeading
        eyebrow={t('ВРЕМЕ ЗА ОБЯД')}
        title={t('Нещо вкусно.')}
        accent={t('Всеки обяд.')}
        description={t('Обедните предложения на Лучиано, събрани на едно място.')}
      />
      <LunchMenu />
    </main>
  );
}
