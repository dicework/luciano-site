import { getTranslator, type Locale } from '@/i18n';
import Link from '@/components/i18n/localized-link';
import Image from 'next/image';
import { ArrowUpRight, Camera } from 'lucide-react';
import { navigation, restaurant } from '@/content/restaurant';
export function Footer({ locale = 'bg' }: { locale?: Locale }) {
  const t = getTranslator(locale);
  return (
    <footer className="footer">
      <div className="wrap footer-grid">
        <div>
          <Link className="brand brand-badge" href="/" aria-label={t('Лучиано — начало')}>
            <Image src="/images/brand/luchiano-badge.webp" alt={t('Лучиано')} width={512} height={512} loading="lazy" />
          </Link>
          <p>
            {t('Малко Италия.')}
            <br />
            {t('Много поводи да се върнете.')}
          </p>
        </div>
        <div>
          <h3>{t('На нашата маса')}</h3>
          <nav aria-label={t('Връзки във футъра')}>
            {navigation.slice(1).map((n) => (
              <Link key={n.href} href={n.href}>
                {t(n.label)}
              </Link>
            ))}
            <Link href="/reservations/">{t('Резервации')}</Link>
          </nav>
        </div>
        <div>
          <h3>{t('Заповядайте')}</h3>
          <p>
            {t(restaurant.address)}
            <br />
            {t(restaurant.city)}
            {t(', България')}
          </p>
          <p>
            {t('Всеки ден · ')}
            {restaurant.hours}
          </p>
          <a href={restaurant.mapUrl} target="_blank" rel="noopener noreferrer" className="footer-link">
            {t('Как да стигнете ')}
            <ArrowUpRight size={16} />
          </a>
        </div>
        <div>
          <h3>{t('Да се чуем')}</h3>
          <a className="footer-phone" href={'tel:' + restaurant.phone}>
            {restaurant.displayPhone}
          </a>
          <p>{t('За поръчки и резервации')}</p>
          <a className="footer-link" href={restaurant.instagram} target="_blank" rel="noopener noreferrer">
            <Camera size={16} />
            {restaurant.instagramHandle}
          </a>
        </div>
      </div>
      <div className="wrap footer-bottom">
        <span>{t('© 2026 Лучиано. С вкус към хубавите моменти.')}</span>
        <span>{t('Варна, България')}</span>
      </div>
    </footer>
  );
}
