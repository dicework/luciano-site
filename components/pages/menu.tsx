import { getTranslator, type Locale } from '@/i18n';
import { localizedMetadata } from '@/i18n/metadata';
import type { Metadata } from 'next';
import { PageHeading } from '@/components/site/section-heading';
import { MenuBrowser } from '@/components/menu/menu-browser';
import Link from '@/components/i18n/localized-link';
import { DeliveryTerms } from '@/components/site/delivery-terms';
export function pageMetadata(locale: Locale): Metadata {
  const t = getTranslator(locale);
  const meta = {
    title: t('Меню и поръчки'),
    description: t(
      'Разгледайте пиците, пастите, салатите и барбекюто на Лучиано. Изберете ястия и подгответе поръчка по WhatsApp или Viber.',
    ),
    alternates: { canonical: '/menu/' },
  };
  return localizedMetadata(meta, locale);
}
export default function MenuPage({ locale = 'bg' }: { locale?: Locale }) {
  const t = getTranslator(locale);
  return (
    <main id="main">
      <PageHeading
        eyebrow={t('ОТ НАШАТА КУХНЯ')}
        title={t('За всеки вкус.')}
        accent={t('И за споделяне.')}
        description={t('Изберете нещо любимо. Добавете го в поръчката и ни пишете — ние ще уточним останалото.')}
      />
      <div className="wrap menu-intro-note">
        <span>{t('Пица на пещ · 26, 33 или 50 см')}</span>
        <span>{t('Всички цени са в евро · Поръчките се потвърждават от екипа')}</span>
      </div>
      <DeliveryTerms locale={locale} />
      <nav className="wrap menu-switch" aria-label={t('Избор на меню')}>
        <Link href="/menu/" aria-current="page">
          {t('Основно меню')}
        </Link>
        <Link href="/lunch/">{t('Обедно меню')}</Link>
      </nav>
      <MenuBrowser />
    </main>
  );
}
