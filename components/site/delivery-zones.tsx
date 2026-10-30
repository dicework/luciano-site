import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import { getTranslator, type Locale } from '@/i18n';
import { deliveryMap, deliveryZones } from '@/content/delivery';
import { deliveryTermsText } from '@/components/site/delivery-terms';
export function DeliveryZones({ locale = 'bg' }: { locale?: Locale }) {
  const t = getTranslator(locale);
  const full = deliveryMap.path + locale + '.webp';
  const compact = deliveryMap.path + locale + '-1200.webp';
  return (
    <section id="delivery-zones" className="wrap section delivery-zones" aria-labelledby="delivery-zones-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{t('ДОСТАВКА')}</p>
          <h2 id="delivery-zones-title">
            {t('Зони за ')}
            <em>{t('доставка.')}</em>
          </h2>
        </div>
        <div>
          <p>{t('Доставяме в кварталите, отбелязани на картата. Ако не сте сигурни за адреса си, обадете ни се.')}</p>
          <p className="delivery-zones-terms">{deliveryTermsText(locale)}</p>
        </div>
      </div>
      <figure className="delivery-map">
        <a href={full} target="_blank" rel="noopener noreferrer" className="delivery-map-image">
          <picture>
            <source
              type="image/webp"
              srcSet={compact + ' 1200w, ' + full + ' 2400w'}
              sizes="(max-width: 760px) calc(100vw - 40px), (max-width: 1150px) calc(100vw - 64px), 1320px"
            />
            <Image
              src={full}
              alt={t('Карта на Варна със зоните за доставка на Лучиано и ресторанта на ул. „Русе“ 13')}
              width={deliveryMap.width}
              height={deliveryMap.height}
              loading="lazy"
            />
          </picture>
        </a>
        <figcaption>
          <ul className="delivery-zone-list" aria-label={t('Квартали за доставка')}>
            {deliveryZones.map((zone) => (
              <li key={zone}>{t(zone)}</li>
            ))}
          </ul>
          <div className="delivery-map-meta">
            <a href={full} target="_blank" rel="noopener noreferrer">
              {t('Отвори картата в пълен размер')}
              <ArrowUpRight size={15} aria-hidden="true" />
            </a>
            <a href={deliveryMap.attributionUrl} target="_blank" rel="noopener noreferrer">
              {t('Картни данни © OpenStreetMap contributors, Overture Maps Foundation')}
            </a>
          </div>
        </figcaption>
      </figure>
    </section>
  );
}
