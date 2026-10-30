'use client';
import { Check, Truck } from 'lucide-react';
import { useI18n } from '@/components/i18n/language-provider';
import type { Locale } from '@/i18n';
import { money } from '@/lib/order';
import { FREE_DELIVERY_FROM_MINOR, MINIMUM_ORDER_MINOR, type DeliveryQuote } from '@/lib/delivery';

// `short` fits the one-line cart bar on phones.
export function deliveryStatus(quote: DeliveryQuote, t: (text: string) => string, locale: Locale, short = false) {
  if (quote.toMinimumMinor > 0)
    return short ?
        t('Още {amount} до минималната поръчка').replace('{amount}', money(quote.toMinimumMinor, locale))
      : t('Минимална поръчка за доставка: {minimum}. Добавете още {amount}.')
          .replace('{minimum}', money(MINIMUM_ORDER_MINOR, locale))
          .replace('{amount}', money(quote.toMinimumMinor, locale));
  if (quote.toFreeDeliveryMinor > 0)
    return t('Още {amount} до безплатна доставка.').replace('{amount}', money(quote.toFreeDeliveryMinor, locale));
  return short ? t('Безплатна доставка') : t('Безплатна доставка за тази поръчка.');
}

// Progress toward the minimum order and free delivery, with the order's delivery fee and total.
export function DeliverySummary({ quote }: { quote: DeliveryQuote }) {
  const { locale, t } = useI18n();
  const stage =
    quote.toMinimumMinor > 0 ? 'below-minimum'
    : quote.toFreeDeliveryMinor > 0 ? 'paid-delivery'
    : 'free-delivery';
  const minimumAt = (MINIMUM_ORDER_MINOR / FREE_DELIVERY_FROM_MINOR) * 100 + '%';
  return (
    <div className={'delivery-summary ' + stage}>
      <output className="delivery-status">
        {stage === 'free-delivery' ?
          <Check size={17} aria-hidden="true" />
        : <Truck size={17} aria-hidden="true" />}
        {deliveryStatus(quote, t, locale)}
      </output>
      <div className="delivery-meter" aria-hidden="true">
        <span style={{ width: Math.min(100, (quote.itemsMinor / FREE_DELIVERY_FROM_MINOR) * 100) + '%' }} />
        <i style={{ left: minimumAt }} />
      </div>
      <div className="delivery-meter-labels" aria-hidden="true">
        <span style={{ left: minimumAt }}>{money(MINIMUM_ORDER_MINOR, locale)}</span>
        <span>{money(FREE_DELIVERY_FROM_MINOR, locale)}</span>
      </div>
      <dl className="cart-totals">
        <div>
          <dt>{t('Продукти')}</dt>
          <dd>{money(quote.itemsMinor, locale)}</dd>
        </div>
        <div>
          <dt>{t('Доставка')}</dt>
          <dd>{quote.deliveryMinor ? money(quote.deliveryMinor, locale) : t('Безплатна')}</dd>
        </div>
        <div className="cart-total">
          <dt>{t('Ориентировъчна сума')}</dt>
          <dd>
            <strong>{money(quote.totalMinor, locale)}</strong>
          </dd>
        </div>
      </dl>
    </div>
  );
}
