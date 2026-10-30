import { getTranslator, type Locale } from '@/i18n';
import { localizedMetadata } from '@/i18n/metadata';
import type { Metadata } from 'next';
import { PageHeading } from '@/components/site/section-heading';
import { LunchMenu } from '@/components/lunch/lunch-menu';
import { DeliveryTerms } from '@/components/site/delivery-terms';

export function pageMetadata(locale: Locale): Metadata {
  const t = getTranslator(locale);
  const meta = {
    title: t('Седмично обедно меню в центъра'),
    description: t(
      'Седмичното обедно меню на Лучиано на ул. „Русе“ 13 в центъра на Варна. Поръчайте онлайн с доставка в обедните часове.',
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
        title={t('Обедно меню.')}
        accent={t('Нещо вкусно всеки обяд.')}
        description={t('Обедните предложения на Лучиано, събрани на едно място.')}
      />
      <DeliveryTerms locale={locale} />
      <LunchMenu />
    </main>
  );
}
