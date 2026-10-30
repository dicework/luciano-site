'use client';
import { intlLocale, type Locale } from '@/i18n';
import { localizeItem } from '@/i18n/content';
import { useI18n } from '@/components/i18n/language-provider';
import Link from '@/components/i18n/localized-link';
import { CalendarDays, Clock, Phone } from 'lucide-react';
import { lunchWeek } from '@/content/lunch';
import { restaurant } from '@/content/restaurant';
import { visibleLunchWeek, lunchIsOpen } from '@/lib/lunch';
import { useRestaurantTime } from '@/components/cart/cart-provider';
import { MenuItemView } from '@/components/menu/menu-item';

function dateLabel(date: string, options: Intl.DateTimeFormatOptions, locale: Locale) {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    ...options,
    timeZone: 'UTC',
  }).format(new Date(date + 'T12:00:00Z'));
}

export function LunchMenu({ preview = false }: { preview?: boolean }) {
  const { locale, t } = useI18n();
  const localDateTime = useRestaurantTime();
  const week = visibleLunchWeek(lunchWeek, localDateTime?.date ?? null);
  const open = lunchIsOpen(week, localDateTime);
  return (
    <section className={preview ? 'lunch-section' : 'lunch-page'} aria-label={t('Обедно меню')}>
      <div className="wrap">
        {preview && (
          <div className="section-heading">
            <div>
              <p className="eyebrow">{t('ВРЕМЕ ЗА ОБЯД')}</p>
              <h2>
                {t('Обедната ни ')}
                <em>{t('маса.')}</em>
              </h2>
            </div>
            <Link className="text-link" href="/lunch/">
              {t('Седмично обедно меню')}
            </Link>
          </div>
        )}
        {week ?
          <div className="lunch-weekly-sheet">
            <div className="lunch-sheet-heading">
              <p className="eyebrow">{t('СЕДМИЧНО ОБЕДНО МЕНЮ')}</p>
              <div className="lunch-meta">
                <span>
                  <CalendarDays size={18} />
                  {dateLabel(week.validFrom, { day: 'numeric' }, locale)}-
                  {dateLabel(
                    week.validUntil,
                    {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    },
                    locale,
                  )}
                </span>
                <span>
                  {week.weekdays
                    .map((day) =>
                      new Intl.DateTimeFormat(intlLocale(locale), { weekday: 'short', timeZone: 'UTC' }).format(
                        new Date(Date.UTC(2026, 0, 4 + day)),
                      ),
                    )
                    .join(', ')}
                </span>
                <span>
                  <Clock size={18} />
                  {week.hours.from}-{week.hours.until}
                </span>
              </div>
              {!open && (
                <p className="lunch-order-note">
                  {t('Поръчките са достъпни в посочените дни и часове:')} {week.hours.from}-{week.hours.until}.
                </p>
              )}
            </div>
            <div className="lunch-dish-list menu-compact-list">
              {week.items.map((item) => (
                <MenuItemView key={item.id} item={localizeItem(item, locale)} compact disabled={!open} />
              ))}
            </div>
            <p className="lunch-sheet-note">
              {t('Обедното меню се обновява всяка седмица. Поръчките се потвърждават от екипа на Лучиано.')}
            </p>
          </div>
        : <div className="lunch-empty">
            <CalendarDays size={32} strokeWidth={1.4} />
            <div>
              <h3>{t('Какво ще има за обяд?')}</h3>
              <p>{t('Очаквайте обедното меню за тази седмица. За предложенията днес ни се обадете.')}</p>
            </div>
            <a className="btn btn-outline" href={'tel:' + restaurant.phone}>
              <Phone size={17} />
              {restaurant.displayPhone}
            </a>
          </div>
        }
        {!preview && (
          <Link className="text-link lunch-regular-link" href="/menu/">
            {t('Разгледай основното меню')}
          </Link>
        )}
      </div>
    </section>
  );
}
