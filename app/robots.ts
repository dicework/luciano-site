import type { MetadataRoute } from 'next';
import { restaurant } from '@/content/restaurant';
export const dynamic = 'force-static';
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: restaurant.siteUrl + '/sitemap.xml',
  };
}
