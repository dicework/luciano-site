import type { MenuCategory, MenuItem, MenuTag } from '../types/menu';
import type { LunchWeek } from '../types/lunch';

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid menu record');
  return value as Record<string, unknown>;
}
function text(value: unknown, max = 1000, required = false): string {
  if (value == null && !required) return '';
  if (typeof value !== 'string' || value.length > max || (required && !value.trim()))
    throw new Error('Invalid menu text');
  return value.trim();
}
function id(value: unknown, seen: Set<string>): string {
  const result = text(value, 200, true);
  if (!/^[\w-]+$/.test(result) || seen.has(result)) throw new Error('Invalid or duplicate menu ID');
  seen.add(result);
  return result;
}
function array(value: unknown, max: number): unknown[] {
  if (!Array.isArray(value) || value.length > max) throw new Error('Invalid menu list');
  return value;
}
function flag(value: unknown, fallback: boolean): boolean {
  if (value == null) return fallback;
  if (typeof value !== 'boolean') throw new Error('Invalid menu toggle');
  return value;
}
function parseItem(value: unknown, ids: Set<string>, prefix = ''): MenuItem {
  const row = record(value);
  const itemId = id(row.id, ids);
  if (!prefix && itemId.startsWith('lunch-')) throw new Error('Reserved lunch ID');
  const variantIds = new Set<string>();
  const variants = array(row.variants, 10).map((value) => {
    const variant = record(value);
    const price = variant.price;
    if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0 || price > 1000)
      throw new Error('Invalid menu price');
    const priceMinor = Math.round(price * 100);
    if (priceMinor < 1 || Math.abs(price * 100 - priceMinor) > 1e-8)
      throw new Error('Menu prices must have at most two decimal places');
    return {
      id: id(variant.id, variantIds),
      label: text(variant.label, 80, true),
      labelEn: text(variant.labelEn, 80),
      priceMinor,
      available: flag(variant.available, true),
    };
  });
  if (!variants.length) throw new Error('Missing menu portions');
  const image = text(row.image, 500);
  if (image && (!/^\/images\/menu\/[\w ./-]+\.(?:jpe?g|png|webp|avif)$/i.test(image) || image.includes('..')))
    throw new Error('Invalid menu photo');
  const tags = array(row.tags ?? [], 3).map((tag): MenuTag => {
    if (tag !== 'vegetarian' && tag !== 'spicy' && tag !== 'popular') throw new Error('Invalid menu tag');
    return tag;
  });
  return {
    id: prefix + itemId,
    name: text(row.name, 120, true),
    nameEn: text(row.nameEn, 120),
    description: text(row.description),
    descriptionEn: text(row.descriptionEn),
    image: image || undefined,
    variants,
    tags,
    available: flag(row.available, true),
    featured: flag(row.featured, false),
  };
}

// Both the rendered menu and server checkout use these validated, versioned files.
export function parseMenu(value: unknown): MenuCategory[] {
  const categories = new Set<string>();
  const items = new Set<string>();
  const menu = array(record(value).categories, 30).map((value): MenuCategory => {
    const row = record(value);
    const categoryId = id(row.id, categories);
    if (categoryId === 'lunch') throw new Error('Reserved lunch category');
    return {
      id: categoryId,
      name: text(row.name, 100, true),
      nameEn: text(row.nameEn, 100),
      description: text(row.description, 500),
      descriptionEn: text(row.descriptionEn, 500),
      items: array(row.items, 200).map((item) => parseItem(item, items)),
    };
  });
  if (!menu.length || items.size > 500) throw new Error('Missing or oversized menu');
  return menu;
}
function date(value: unknown): string {
  const result = text(value, 10, true);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result) || new Date(result + 'T12:00:00Z').toISOString().slice(0, 10) !== result)
    throw new Error('Invalid lunch date');
  return result;
}
function time(value: unknown): string {
  const result = text(value, 5, true);
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(result)) throw new Error('Invalid lunch time');
  return result;
}
export function parseLunchWeek(value: unknown): LunchWeek | null {
  const week = record(value);
  if (!flag(week.enabled, true)) return null;
  const validFrom = date(week.validFrom), validUntil = date(week.validUntil);
  const hours = record(week.hours);
  const from = time(hours.from), until = time(hours.until);
  // Select values are strings in Pages CMS; the ordering rules use numeric weekdays.
  const weekdays = array(week.weekdays, 7).map((day) => {
    if (typeof day !== 'string' || !/^[0-6]$/.test(day)) throw new Error('Invalid lunch weekday');
    return Number(day);
  });
  if (validFrom > validUntil || from >= until || !weekdays.length || new Set(weekdays).size !== weekdays.length)
    throw new Error('Invalid lunch schedule');
  const ids = new Set<string>();
  return {
    validFrom, validUntil, hours: { from, until }, weekdays,
    // A new week expires saved cart lines even when the owner reuses the dish.
    items: array(week.items, 100).map((item) => parseItem(item, ids, `lunch-${validFrom}-`)),
  };
}
