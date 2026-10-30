import type { Metadata } from 'next';
import { restaurant } from '@/content/restaurant';
import { getTranslator, localePath, type Locale } from './index';
// Link previews in Viber, WhatsApp and Facebook show the round restaurant badge as a square thumbnail.
export function shareImage(locale: Locale) {
  return { url: restaurant.logo, width: 800, height: 800, alt: getTranslator(locale)('Пицария Лучиано') };
}
export function languageAlternates(path: string, locale: Locale) {
  return {
    canonical: localePath(path, locale),
    languages: {
      bg: localePath(path, 'bg'),
      en: localePath(path, 'en'),
      'x-default': localePath(path, 'bg'),
    },
  };
}
export function localizedMetadata(
  meta: {
    title?: string;
    description?: string;
    alternates: { canonical: string };
  },
  locale: Locale,
): Metadata {
  const t = getTranslator(locale);
  return {
    ...meta,
    alternates: languageAlternates(meta.alternates.canonical, locale),
    openGraph: {
      type: 'website',
      siteName: t('Лучиано'),
      locale: locale === 'bg' ? 'bg_BG' : 'en_GB',
      alternateLocale: locale === 'bg' ? 'en_GB' : 'bg_BG',
      title: meta.title ?? t('Пицария Лучиано: пица на пещ и обедно меню във Варна'),
      description: meta.description ?? t('Пица на пещ, прясна паста и хубава компания на ул. „Русе“ 13, Варна.'),
      url: localePath(meta.alternates.canonical, locale),
      images: [shareImage(locale)],
    },
    // A square badge reads best as the small summary card rather than a wide banner.
    twitter: { card: 'summary' },
  };
}
