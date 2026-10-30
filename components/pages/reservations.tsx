import { getTranslator, type Locale } from '@/i18n';
import { localizedMetadata } from '@/i18n/metadata';
import Image from 'next/image';
import type { Metadata } from 'next';
import { ReservationForm } from '@/components/reservations/reservation-form';
import { restaurant } from '@/content/restaurant';
import { Phone, Clock, MapPin } from 'lucide-react';
export function pageMetadata(locale: Locale): Metadata {
  const t = getTranslator(locale);
  const meta = {
    title: t('Резервация на маса'),
    description: t('Запазете маса в Лучиано, Варна. Изпратете запитване онлайн или се обадете на +359 88 609 4164.'),
    alternates: { canonical: '/reservations/' },
  };
  return localizedMetadata(meta, locale);
}
export default function ReservationsPage({ locale = 'bg' }: { locale?: Locale }) {
  const t = getTranslator(locale);
  return (
    <main id="main" className="wrap reservation-layout">
      <div className="reservation-aside">
        <p className="eyebrow">{t('ИМА МЯСТО ЗА ВАС')}</p>
        <h1>
          {t('Добрата компания')}
          <br />
          {t('заслужава ')}
          <em>{t('хубава маса.')}</em>
        </h1>
        <Image
          src="/images/interior.webp"
          alt={t('Уютни маси и меки кресла в Лучиано')}
          width={900}
          height={600}
          loading="eager"
        />
        <div className="contact-lines">
          <a href={'tel:' + restaurant.phone}>
            <Phone />
            {restaurant.displayPhone}
          </a>
          <span>
            <Clock />
            {t('Всеки ден · ')}
            {restaurant.hours}
          </span>
          <a href={restaurant.mapUrl} target="_blank" rel="noopener noreferrer">
            <MapPin />
            {t(restaurant.address)}
            {t(', Варна')}
          </a>
        </div>
        <p>{t('За големи компании, специален повод или резервация в последния момент ни се обадете.')}</p>
      </div>
      <ReservationForm />
    </main>
  );
}
