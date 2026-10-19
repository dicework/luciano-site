import { menu } from '../content/menu.ts';
import { getTranslator, type Locale } from './index.ts';
import type { MenuCategory, MenuItem } from '../types/menu';
export function localizeItem(item: MenuItem, locale: Locale): MenuItem {
  if (locale === 'bg') return item;
  const t = getTranslator(locale);
  return {
    ...item,
    name: item.nameEn || t(item.name),
    description: item.descriptionEn || t(item.description),
    variants: item.variants.map((variant) => ({
      ...variant,
      label: variant.labelEn || t(variant.label),
    })),
  };
}
export function localizeMenu(menu: MenuCategory[], locale: Locale): MenuCategory[] {
  if (locale === 'bg') return menu;
  const t = getTranslator(locale);
  return menu.map((category) => ({
    ...category,
    name: category.nameEn || t(category.name),
    description: category.descriptionEn || (category.description ? t(category.description) : undefined),
    items: category.items.map((item) => localizeItem(item, locale)),
  }));
}
const menus = { bg: menu, en: localizeMenu(menu, 'en') };
export const getMenu = (locale: Locale) => menus[locale];
