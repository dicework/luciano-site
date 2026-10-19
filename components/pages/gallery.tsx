import { getTranslator, type Locale } from '@/i18n';
import { localizedMetadata } from '@/i18n/metadata';
import type { Metadata } from 'next';
import { PageHeading } from '@/components/site/section-heading';
import { GalleryGrid } from '@/components/gallery/gallery-grid';
import { restaurant } from '@/content/restaurant';
export function pageMetadata(locale: Locale): Metadata {
  const t = getTranslator(locale);
  const meta = {
    title: t('Галерия'),
    description: t(
      'Погледнете храната и атмосферата на ресторант Лучиано, Варна. Истински снимки от нашата кухня и уютния ни интериор.',
    ),
    alternates: { canonical: '/gallery/' },
  };
  return localizedMetadata(meta, locale);
}
export default function GalleryPage({ locale = 'bg' }: { locale?: Locale }) {
  const t = getTranslator(locale);
  return (
    <main id="main">
      <PageHeading
        eyebrow={t('НЯКОЛКО ВКУСНИ МОМЕНТА')}
        title={t('Вкус, който се вижда.')}
        accent={t('Уют, който се усеща.')}
        description={t('От първото парче до последния разговор. Малко от ежедневието на Лучиано.')}
      />
      <GalleryGrid />
      <div className="gallery-instagram wrap">
        <p>{t('Още от нашата кухня и ежедневие')}</p>
        <a className="text-link" href={restaurant.instagram} target="_blank" rel="noopener noreferrer">
          {restaurant.instagramHandle} ↗
        </a>
      </div>
    </main>
  );
}
