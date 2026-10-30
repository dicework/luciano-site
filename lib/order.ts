import { getTranslator, intlLocale, type Locale } from '../i18n/index.ts';
import { deliveryQuote } from './delivery.ts';
import type { CartLine, MenuCategory, ResolvedLine } from '../types/menu';
export function money(minor: number, locale: Locale = 'bg') {
  return new Intl.NumberFormat(intlLocale(locale), {
    style: 'currency',
    currency: 'EUR',
  }).format(minor / 100);
}
export function reconcileCart(input: unknown, menu: MenuCategory[]): CartLine[] {
  if (!Array.isArray(input)) return [];
  const result: CartLine[] = [];
  const items = menu.flatMap((category) => category.items);
  for (const raw of input.slice(0, 300)) {
    if (!raw || typeof raw !== 'object') continue;
    const { itemId, variantId, quantity } = raw;
    if (typeof itemId !== 'string' || typeof variantId !== 'string' || !Number.isInteger(quantity) || quantity <= 0)
      continue;
    const item = items.find((i) => i.id === itemId);
    const variant = item?.variants.find((v) => v.id === variantId);
    if (!item || item.available === false || !variant || variant.available === false) continue;
    const existing = result.find((r) => r.itemId === itemId && r.variantId === variantId);
    if (existing) existing.quantity = Math.min(99, existing.quantity + quantity);
    else result.push({ itemId, variantId, quantity: Math.min(quantity, 99) });
  }
  return result;
}
export function resolveCart(lines: CartLine[], menu: MenuCategory[]): ResolvedLine[] {
  const items = menu.flatMap((category) => category.items);
  return reconcileCart(lines, menu).map((line) => {
    const item = items.find((i) => i.id === line.itemId)!;
    const variant = item.variants.find((v) => v.id === line.variantId)!;
    return {
      ...line,
      name: item.name,
      variantLabel: variant.label,
      priceMinor: variant.priceMinor,
    };
  });
}
export function orderTotal(lines: ResolvedLine[]) {
  return lines.reduce((sum, l) => sum + l.priceMinor * l.quantity, 0);
}
export function orderMessage(lines: ResolvedLine[], notes = '', locale: Locale = 'bg') {
  const t = getTranslator(locale);
  if (!lines.length) throw new Error(t('Поръчката е празна.'));
  const quote = deliveryQuote(orderTotal(lines));
  return [
    t('Здравейте, Лучиано! Бих искал/а да поръчам:'),
    ...lines.map(
      (l) => l.quantity + ' × ' + l.name + ' (' + l.variantLabel + ') — ' + money(l.priceMinor * l.quantity, locale),
    ),
    '',
    t('Доставка: ') + (quote.deliveryMinor ? money(quote.deliveryMinor, locale) : t('безплатна')),
    t('Ориентировъчна сума: ') + money(quote.totalMinor, locale),
    notes.trim() ? t('Бележка: ') + notes.trim() : '',
    t('Моля, потвърдете наличността, крайната сума и кога мога да получа поръчката.'),
  ]
    .filter(Boolean)
    .join('\n');
}
export interface Reservation {
  name: string;
  phone: string;
  address: string;
  guests: number;
  date: string;
  time: string;
  notes: string;
}
export function sofiaDateTime(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Sofia',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return {
    date: get('year') + '-' + get('month') + '-' + get('day'),
    time: get('hour') + ':' + get('minute'),
  };
}
export function validateReservation(r: Reservation, now = new Date(), locale: Locale = 'bg'): string | null {
  const t = getTranslator(locale);
  if (r.name.trim().length < 2) return t('Моля, въведете вашето име.');
  if (!/^\+?[\d\s()-]{7,20}$/.test(r.phone) || r.phone.replace(/\D/g, '').length < 7)
    return t('Моля, въведете валиден телефон.');
  if (
    r.address.trim().length < 5 ||
    r.address.length > 300 ||
    // eslint-disable-next-line no-control-regex -- Keep addresses on one notification line.
    /[\x00-\x1f\x7f]/.test(r.address)
  )
    return t('Моля, въведете адрес (между 5 и 300 знака).');
  if (!Number.isInteger(r.guests) || r.guests < 1 || r.guests > 30)
    return t('Изберете между 1 и 30 гости. За по-голяма компания ни се обадете.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(r.time))
    return t('Изберете дата и час.');
  const parsed = new Date(r.date + 'T12:00:00Z');
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== r.date)
    return t('Изберете валидна дата.');
  const local = sofiaDateTime(now);
  if (r.date + 'T' + r.time <= local.date + 'T' + local.time) return t('Моля, изберете бъдещи дата и час.');
  if (r.time < '08:00' || r.time > '21:30') return t('Изберете час между 08:00 и 21:30. Затваряме в 22:00.');
  return null;
}
export function reservationMessage(r: Reservation, locale: Locale = 'bg') {
  const t = getTranslator(locale);
  const [year, month, day] = r.date.split('-');
  return [
    t('Здравейте, Лучиано! Бих искал/а да резервирам маса:'),
    t('Име: ') + r.name.trim(),
    t('Телефон: ') + r.phone.trim(),
    t('Адрес: ') + r.address.trim(),
    t('Гости: ') + r.guests,
    t('Дата: ') + day + '.' + month + '.' + year,
    t('Час: ') + r.time + t(' (Варна)'),
    r.notes.trim() ? t('Бележка: ') + r.notes.trim() : '',
    t('Моля, потвърдете резервацията.'),
  ]
    .filter(Boolean)
    .join('\n');
}
