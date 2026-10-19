import { getTranslator, type Locale } from '@/i18n';
import Link from '@/components/i18n/localized-link';
import { ArrowUpRight, MapPin, Clock, Phone } from 'lucide-react';
import { restaurant } from '@/content/restaurant';
export function Location({ compact = false, locale = 'bg' }: { compact?: boolean; locale?: Locale }) {
  const t = getTranslator(locale);
  return (
    <section className={'location-section ' + (compact ? 'location-compact' : '')}>
      <div className="wrap location-grid">
        <div>
          <p className="eyebrow">{t('ЩЕ СЕ ВИДИМ В ЛУЧИАНО')}</p>
          <h2>
            {t('Вашата маса')}
            <br />
            <em>{t('в центъра на Варна.')}</em>
          </h2>
          <div className="contact-lines">
            <a href={restaurant.mapUrl} target="_blank" rel="noopener noreferrer">
              <MapPin />
              {t(restaurant.address)}, {t(restaurant.city)}
            </a>
            <span>
              <Clock />
              {t('Всеки ден · ')}
              {restaurant.hours}
            </span>
            <a href={'tel:' + restaurant.phone}>
              <Phone />
              {restaurant.displayPhone}
            </a>
          </div>
          <div className="actions">
            <Link href="/reservations/" className="btn btn-red">
              {t('Запази маса ')}
              <ArrowUpRight size={18} />
            </Link>
            <a href={restaurant.mapUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
              {t('Как да стигнеш')}
            </a>
          </div>
        </div>
        <div className="map-frame">
          <iframe
            src={restaurant.mapEmbed}
            title={t('Местоположение на ресторант Лучиано, ул. Русе 13, Варна')}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
          <a href={restaurant.mapUrl} target="_blank" rel="noopener noreferrer" className="map-label">
            {t('Лучиано · ул. „Русе“ 13 ')}
            <ArrowUpRight size={18} />
          </a>
        </div>
      </div>
    </section>
  );
}
