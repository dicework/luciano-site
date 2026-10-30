import { getTranslator, type Locale } from '@/i18n';
import { localizedMetadata } from '@/i18n/metadata';
import type { Metadata } from 'next';
import { PageHeading } from '@/components/site/section-heading';
import { MenuBrowser } from '@/components/menu/menu-browser';
import Link from '@/components/i18n/localized-link';
import { DeliveryTerms } from '@/components/site/delivery-terms';
import { money } from '@/lib/order';
import { FREE_DELIVERY_FROM_MINOR, MINIMUM_ORDER_MINOR } from '@/lib/delivery';
export function pageMetadata(locale: Locale): Metadata {
  const t = getTranslator(locale);
  const meta = {
    title: t('Меню: пица, паста, салати и скара'),
    description: t(
      'Пица на пещ в 26, 33 и 50 см, паста, салати и скара. Поръчайте онлайн с доставка във Варна от {minimum}, безплатна доставка от {free}.',
    )
      .replace('{minimum}', money(MINIMUM_ORDER_MINOR, locale))
      .replace('{free}', money(FREE_DELIVERY_FROM_MINOR, locale)),
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
        title={t('Пица, паста и скара.')}
        accent={t('За всеки вкус.')}
        description={t('Изберете нещо любимо. Добавете го в поръчката и ни пишете. Ние ще уточним останалото.')}
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
