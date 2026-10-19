import { en } from './en.ts';

export const locales = ['bg', 'en'] as const;
export type Locale = (typeof locales)[number];
export const intlLocale = (locale: Locale) => (locale === 'bg' ? 'bg-BG' : 'en-GB');
export const messageKey = (text: string) => text.replace(/\s+/g, ' ').trim();
const english: Record<string, string> = en;
const bulgarian: Record<string, string> = {
  'PIZZA & SALAD': 'ПИЦА И САЛАТИ',
  'BAR & DINNER': 'БАР И ВЕЧЕРЯ',
  'PIZZA • BAR • DINNER': 'ПИЦА • БАР • ВЕЧЕРЯ',
  'BUONA CUCINA, BELLA COMPAGNIA': 'ХУБАВА ХРАНА, ДОБРА КОМПАНИЯ',
  'Buon appetito!': 'Добър апетит!',
  Buon: 'Добър',
  'appetito!': 'апетит!',
};
export function getTranslator(locale: Locale) {
  return (text: string): string => {
    const key = messageKey(text);
    const translated = (locale === 'en' ? english : bulgarian)[key] ?? key;
    return (text.match(/^\s+/)?.[0] ?? '') + translated + (text.match(/\s+$/)?.[0] ?? '');
  };
}
export function localePath(path: string, locale: Locale) {
  const unprefixed = path.replace(/^\/en(?=\/|\?|#|$)/, '') || '/';
  return locale === 'en' ? '/en' + (unprefixed.startsWith('/') ? unprefixed : '/' + unprefixed) : unprefixed;
}
