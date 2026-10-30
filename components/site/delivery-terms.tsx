import { ArrowUpRight, Truck } from 'lucide-react';
import Link from '@/components/i18n/localized-link';
import { getTranslator, type Locale } from '@/i18n';
import { money } from '@/lib/order';
import { DELIVERY_FEE_MINOR, FREE_DELIVERY_FROM_MINOR, MINIMUM_ORDER_MINOR } from '@/lib/delivery';

export function deliveryTermsText(locale: Locale) {
  return getTranslator(locale)('Доставка {fee} · безплатна при поръчка от {free} · минимална поръчка {minimum}')
    .replace('{fee}', money(DELIVERY_FEE_MINOR, locale))
    .replace('{free}', money(FREE_DELIVERY_FROM_MINOR, locale))
    .replace('{minimum}', money(MINIMUM_ORDER_MINOR, locale));
}

// Delivery terms where customers choose dishes, linking to the zone map on the contact page.
export function DeliveryTerms({ locale = 'bg' }: { locale?: Locale }) {
  const t = getTranslator(locale);
  return (
    <div className="wrap delivery-terms">
      <p>
        <Truck size={18} aria-hidden="true" />
        {deliveryTermsText(locale)}
      </p>
      <Link href="/contact/#delivery-zones">
        {t('Зони за доставка')}
        <ArrowUpRight size={15} aria-hidden="true" />
      </Link>
    </div>
  );
}
