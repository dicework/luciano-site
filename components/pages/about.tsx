import { getTranslator, type Locale } from '@/i18n';
import { localizedMetadata } from '@/i18n/metadata';
import Image from 'next/image';
import type { Metadata } from 'next';
import Link from '@/components/i18n/localized-link';
import { PageHeading } from '@/components/site/section-heading';
import { Features } from '@/components/site/features';
import { Location } from '@/components/site/location';
export function pageMetadata(locale: Locale): Metadata {
  const t = getTranslator(locale);
  const meta = {
    title: t('За нас'),
    description: t(
      'Лучиано е уютен италиански ресторант в центъра на Варна. Неаполитански пици, домашни пасти и място за хубава компания.',
    ),
    alternates: { canonical: '/about/' },
  };
  return localizedMetadata(meta, locale);
}
export default function AboutPage({ locale = 'bg' }: { locale?: Locale }) {
  const t = getTranslator(locale);
  return (
    <main id="main">
      <PageHeading
        eyebrow={t('НАШАТА ИСТОРИЯ Е НА МАСАТА')}
        title={t('Малко Италия.')}
        accent={t('Съвсем наблизо.')}
        description={t('Лучиано е уютен италиански ъгъл на ул. „Русе“ 13 — за ежедневните срещи и специалните поводи.')}
      />
      <div className="wrap about-panorama">
        <Image
          src="/images/interior.webp"
          width={1800}
          height={650}
          alt={t('Топли тухлени стени, удобни сепарета и маси в ресторант Лучиано')}
          fetchPriority="high"
        />
        <span>{t('Елате за храната. Останете за компанията.')}</span>
      </div>
      <section className="wrap section story-grid">
        <div>
          <p className="eyebrow">{t('ПРОСТИ НЕЩА. ПРИГОТВЕНИ С ГРИЖА.')}</p>
          <h2>
            {t('Италианската кухня')}
            <br />
            {t('говори с ')}
            <em>{t('вкус.')}</em>
          </h2>
        </div>
        <div>
          <p>
            {t(
              'Вярваме в тестото, на което е дадено време, в подбраните съставки и в удоволствието от прясно приготвената храна. Нашите пици са в неаполитански стил — с тънък блат и аромат от пещта.',
            )}
          </p>
          <p>
            {t(
              'Около тях има цял свят от вкусове: домашни пасти, свежи салати, предястия за споделяне, барбекю на жар и риба. За всеки на масата има нещо любимо.',
            )}
          </p>
          <p>
            {t(
              'Независимо дали се отбивате за обяд, идвате със семейството или събирате приятели за празник — заповядайте. Хубавите моменти започват съвсем обикновено.',
            )}
          </p>
          <Link className="text-link" href="/menu/">
            {t('Надникни в менюто ↗')}
          </Link>
        </div>
      </section>
      <Features locale={locale} />
      <Location locale={locale} />
    </main>
  );
}
