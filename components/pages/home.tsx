import { getTranslator, type Locale } from '@/i18n';
import { localizedMetadata } from '@/i18n/metadata';
import type { Metadata } from 'next';
import { IngredientBanner } from '@/components/site/ingredient-banner';
import { LunchMenu } from '@/components/lunch/lunch-menu';
import Image from 'next/image';
import { FeaturedDishes } from '@/components/menu/featured-dishes';
import { Location } from '@/components/site/location';
import { Features } from '@/components/site/features';
export function pageMetadata(locale: Locale): Metadata {
  const meta = { alternates: { canonical: '/' } };
  return localizedMetadata(meta, locale);
}
import Link from '@/components/i18n/localized-link';
import { ArrowUpRight, MapPin, Clock, ArrowRight } from 'lucide-react';

export default function Home({ locale = 'bg' }: { locale?: Locale }) {
  const t = getTranslator(locale);
  return (
    <main id="main">
      <section className="hero wrap">
        <div className="hero-copy">
          <p className="eyebrow">
            <span />
            {t(' МАЛКО НЕАПОЛ. МНОГО ВАРНА.')}
          </p>
          <h1>
            {t('Неаполитанска')}
            <br />
            {t('пица във Варна.')}
          </h1>
          <p className="hero-description">
            {t('Хубавата храна събира хората.')}
            <br />
            {t('Пица от пещта, прясна паста и още малко време заедно в сърцето на града.')}
          </p>
          <div className="actions">
            <Link className="btn btn-red" href="/menu/">
              {t('Поръчай онлайн ')}
              <ArrowUpRight size={18} />
            </Link>
            <Link className="btn btn-outline" href="/reservations/">
              {t('Направи резервация')}
            </Link>
          </div>
          <div className="hero-meta">
            <span>
              <MapPin size={16} />
              {t(' ул. „Русе“ 13, Варна')}
            </span>
            <span>
              <Clock size={16} />
              {t(' Всеки ден · 08:00-22:00')}
            </span>
          </div>
        </div>
        <div className="hero-visual">
          <Image
            className="hero-image"
            src="/images/hero-pizza.webp"
            alt={t('Прясно изпечена пица в ресторант Лучиано')}
            width="1266"
            height="1243"
            loading="eager"
            fetchPriority="high"
          />
          <div className="hero-stamp">
            <span>{t('ПИЦА ОТ ПЕЩТА')}</span>
            <b>
              {t('Buon')}
              <br />
              <i>{t('appetito!')}</i>
            </b>
            <span>{t('С ЛЮБОВ ОТ ЛУЧИАНО')}</span>
          </div>
        </div>
      </section>
      <IngredientBanner locale={locale} />
      <LunchMenu preview />
      <section className="section wrap intro">
        <div>
          <h2>
            {t('Италианска душа.')}
            <br />
            <em>{t('Варненско сърце.')}</em>
          </h2>
          <p>
            {t(
              'На ул. „Русе“ 13 има място за дълги обеди, семейни вечери и срещи без повод. Приготвяме любимите италиански вкусове и ви посрещаме така, както обичаме да посрещат нас, с топлина.',
            )}
          </p>
          <Link className="text-link" href="/about/">
            {t('Историята на Лучиано ')}
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
      <Features locale={locale} />
      <FeaturedDishes locale={locale} />
      <section className="restaurant-banner wrap">
        <Image
          src="/images/interior.webp"
          alt={t('Интериорът на Лучиано с уютни сепарета и топла атмосфера')}
          width={1800}
          height={650}
          loading="lazy"
        />
        <div>
          <p className="eyebrow">{t('ХУБАВИТЕ МОМЕНТИ СА СПОДЕЛЕНИ')}</p>
          <h2>
            {t('Още малко време.')}
            <br />
            <i>{t('Заедно.')}</i>
          </h2>
          <Link href="/gallery/" className="btn btn-outline">
            {t('Усети атмосферата ↗')}
          </Link>
        </div>
      </section>
      <Location locale={locale} />
    </main>
  );
}
