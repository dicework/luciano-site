import { getTranslator, type Locale } from '@/i18n';
import Image from 'next/image';
import Link from '@/components/i18n/localized-link';
import { ArrowUpRight } from 'lucide-react';
import { getMenu } from '@/i18n/content';
import { money } from '@/lib/order';
export function FeaturedDishes({ locale = 'bg' }: { locale?: Locale }) {
  const t = getTranslator(locale);
  const items = getMenu(locale)
    .flatMap((c) => c.items)
    .filter((i) => i.featured);
  return (
    <section className="featured-section">
      <div className="wrap">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t('ТРУДНО Е ДА ИЗБЕРЕШ САМО ЕДНО')}</p>
            <h2>
              {t('Няколко ')}
              <em>{t('любими.')}</em>
            </h2>
          </div>
          <Link href="/menu/" className="text-link">
            {t('Цялото меню ')}
            <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="featured-grid">
          {items.map((item, i) => (
            <Link className="dish-card" href={'/menu/#' + item.id} key={item.id}>
              <div className="dish-card-image">
                {item.image && (
                  <Image
                    src={item.image}
                    alt={item.name + t(' — от менюто на Лучиано')}
                    width={700}
                    height={540}
                    loading="lazy"
                  />
                )}
                <span className="dish-card-number">0{i + 1}</span>
                <span className="dish-card-arrow">
                  <ArrowUpRight size={24} />
                </span>
              </div>
              <div className="dish-card-title">
                <h3>{item.name}</h3>
                <span>
                  {item.variants.length > 1 ? t('от ') : ''}
                  {money(item.variants[0].priceMinor, locale)}
                </span>
              </div>
              <p>{item.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
