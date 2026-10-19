'use client';
import { useI18n } from '@/components/i18n/language-provider';
import Link from '@/components/i18n/localized-link';
import { getMenu } from '@/i18n/content';
import { MenuItemView } from '@/components/menu/menu-item';
export function MenuBrowser() {
  const { locale, t } = useI18n();
  const menu = getMenu(locale);
  return (
    <div className="wrap menu-layout">
      <aside className="menu-sidebar">
        <p className="eyebrow">{t('КАКВО ВИ СЕ ХАПВА?')}</p>
        <nav aria-label={t('Категории в менюто')}>
          {menu.map((c) => (
            <a key={c.id} href={'#' + c.id}>
              {c.name}
              <span>{String(c.items.length).padStart(2, '0')}</span>
            </a>
          ))}
        </nav>
        <Link className="menu-lunch-link" href="/lunch/">
          {t('Седмично обедно меню')}
        </Link>
        <div className="menu-note">
          <span>{t('Buon appetito!')}</span>
          <p>{t('За алергени и специални изисквания попитайте нашия екип.')}</p>
        </div>
      </aside>
      <div className="menu-categories">
        {menu.map((cat, i) => (
          <section className="menu-category" id={cat.id} key={cat.id}>
            <div className="category-heading">
              <h2>{cat.name}</h2>
              <span>/{String(i + 1).padStart(2, '0')}</span>
            </div>
            {cat.description && <p>{cat.description}</p>}
            <div className={['sides', 'sauces'].includes(cat.id) ? 'menu-compact-list' : 'menu-card-grid'}>
              {cat.items.map((item) => (
                <MenuItemView key={item.id} item={item} compact={['sides', 'sauces'].includes(cat.id)} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
