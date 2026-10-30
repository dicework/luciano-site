import { getTranslator, type Locale } from '@/i18n';
import { localizedMetadata } from '@/i18n/metadata';
import type { Metadata } from 'next';
import { ArrowUpRight, CalendarDays, Camera, UtensilsCrossed } from 'lucide-react';
import Link from '@/components/i18n/localized-link';
import { PageHeading } from '@/components/site/section-heading';
import { Location } from '@/components/site/location';
import { DeliveryZones } from '@/components/site/delivery-zones';
import { Messaging } from '@/components/messaging';
import { restaurant } from '@/content/restaurant';
export function pageMetadata(locale: Locale): Metadata {
  const t = getTranslator(locale);
  const meta = {
    title: t('Контакти и местоположение'),
    description: t(
      'Намерете ресторант Лучиано на ул. „Русе“ 13, Варна. Всеки ден 08:00-22:00. Телефон: +359 88 609 4164.',
    ),
    alternates: { canonical: '/contact/' },
  };
  return localizedMetadata(meta, locale);
}
export default function ContactPage({ locale = 'bg' }: { locale?: Locale }) {
  const t = getTranslator(locale);
  return (
    <main id="main">
      <PageHeading
        eyebrow={t('НА НЯКОЛКО КРАЧКИ ОТ ВАС')}
        title={t('До скоро.')}
        accent={t('В Лучиано.')}
        description={t('В центъра на Варна, с топла пица и свободно място за още един хубав разговор.')}
      />
      <Location locale={locale} compact />
      <DeliveryZones locale={locale} />
      <section className="wrap section contact-bottom">
        <div>
          <p className="eyebrow">{t('ПО ВАШИЯ НАЧИН')}</p>
          <h2>
            {t('Да се ')}
            <em>{t('чуем.')}</em>
          </h2>
          <p>{t('За въпроси, поръчки и резервации, обадете се или ни пишете.')}</p>
          <a className="contact-social" href={restaurant.instagram} target="_blank" rel="noopener noreferrer">
            <Camera size={18} aria-hidden="true" />
            {restaurant.instagramHandle}
            <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </div>
        <div className="contact-panel">
          <Messaging message={t('Здравейте, Лучиано! Имам въпрос към вас.')} />
          <nav className="contact-shortcuts" aria-label={t('Още възможности')}>
            <Link href="/menu/">
              <UtensilsCrossed size={18} aria-hidden="true" />
              <span>{t('Разгледай менюто')}</span>
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
            <Link href="/reservations/">
              <CalendarDays size={18} aria-hidden="true" />
              <span>{t('Запази маса')}</span>
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </nav>
        </div>
      </section>
    </main>
  );
}
