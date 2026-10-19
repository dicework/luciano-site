import { locales, localePath } from '@/i18n';
import type { MetadataRoute } from 'next';
import { restaurant } from '@/content/restaurant';
export const dynamic = 'force-static';
export default function sitemap(): MetadataRoute.Sitemap {
  return ['', 'about/', 'menu/', 'lunch/', 'gallery/', 'contact/', 'reservations/'].flatMap((path) =>
    locales.map((locale) => ({
      url: restaurant.siteUrl + localePath('/' + path, locale),
      alternates: {
        languages: Object.fromEntries(
          locales.map((language) => [language, restaurant.siteUrl + localePath('/' + path, language)]),
        ),
      },
      changeFrequency: path === 'menu/' || path === 'lunch/' ? 'weekly' : 'monthly',
      priority: path === '' ? 1 : 0.8,
    })),
  );
}
