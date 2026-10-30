'use client';
import Image from 'next/image';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { useI18n } from '@/components/i18n/language-provider';
import { deliveryMap, deliveryZones } from '@/content/delivery';

// The delivery-zone map, folded next to the address field so customers can check their area while ordering.
export function DeliveryZonesHint() {
  const { locale, t } = useI18n();
  const full = deliveryMap.path + locale + '.webp';
  return (
    <details className="delivery-hint">
      <summary>
        <MapPin size={16} aria-hidden="true" />
        {t('Доставяме ли до вас? Вижте зоните за доставка')}
      </summary>
      <a href={full} target="_blank" rel="noopener noreferrer" className="delivery-map-image">
        <Image
          src={deliveryMap.path + locale + '-1200.webp'}
          alt={t('Карта на Варна със зоните за доставка на Лучиано и ресторанта на ул. „Русе“ 13')}
          width={1200}
          height={800}
          loading="lazy"
        />
      </a>
      <ul className="delivery-zone-list" aria-label={t('Квартали за доставка')}>
        {deliveryZones.map((zone) => (
          <li key={zone}>{t(zone)}</li>
        ))}
      </ul>
      <p className="small">
        {t('Ако адресът ви е извън зоните, обадете ни се, преди да поръчате.')}{' '}
        <a href={full} target="_blank" rel="noopener noreferrer">
          {t('Отвори картата в пълен размер')}
          <ArrowUpRight size={13} aria-hidden="true" />
        </a>
      </p>
    </details>
  );
}
