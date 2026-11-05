'use client';
import { useI18n } from '@/components/i18n/language-provider';
import Link from '@/components/i18n/localized-link';
import { LanguageSwitcher } from '@/components/i18n/language-switcher';
import { localePath } from '@/i18n';
import { usePathname } from 'next/navigation';
import { useState, type CSSProperties } from 'react';
import Image from 'next/image';
import { Menu, X, ShoppingBag, Phone, ArrowUpRight } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle, SheetDescription, SheetClose } from '@/components/ui/sheet';
import { navigation, restaurant } from '@/content/restaurant';
import { useCart } from '@/components/cart/cart-provider';
export function Header() {
  const { locale, t } = useI18n();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const cart = useCart();
  const isCurrent = (href: string) =>
    path.replace(/\/$/, '') === localePath(href, locale).replace(/\/$/, '') ? 'page' : undefined;
  const close = () => setOpen(false);
  return (
    <>
      <div className="topline">
        {t('PIZZA & SALAD ')}
        <span>{t('BUONA CUCINA, BELLA COMPAGNIA')}</span>
        {t(' BAR & DINNER')}
      </div>
      <header className="site-header">
        <div className="header-inner wrap">
          <Link className="brand" href="/" aria-label={t('Лучиано: начало')}>
            <Image
              src="/images/brand/luchiano-wordmark.webp"
              alt={t('Лучиано')}
              width={640}
              height={218}
              loading="eager"
            />
          </Link>
          <nav aria-label={t('Основна навигация')}>
            {navigation.map((n) => (
              <Link key={n.href} href={n.href} aria-current={isCurrent(n.href)}>
                {t(n.label)}
              </Link>
            ))}
          </nav>
          <a className="header-phone" href={'tel:' + restaurant.phone}>
            <Phone size={14} />
            088 609 4164
          </a>
          <Link className="btn btn-red header-reserve" href="/reservations/">
            {t('Резервация ↗')}
          </Link>
          <LanguageSwitcher />
          <button
            className="icon-button cart-toggle"
            onClick={() => cart.setOpen(true)}
            aria-label={t('Отвори поръчката, ') + cart.count + t(cart.count === 1 ? ' артикул' : ' артикула')}
          >
            <ShoppingBag size={21} />
            {cart.count > 0 && <span className="cart-count">{cart.count}</span>}
          </button>
          <button
            className="icon-button mobile-toggle"
            onClick={() => setOpen(true)}
            aria-label={t('Отвори навигацията')}
            aria-haspopup="dialog"
            aria-expanded={open}
          >
            <Menu size={24} />
          </button>
        </div>
      </header>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent showCloseButton={false} className="mobile-nav">
          <div className="mobile-nav-top">
            <Link className="brand" href="/" onClick={close} aria-label={t('Лучиано: начало')}>
              <Image src="/images/brand/luchiano-wordmark.webp" alt={t('Лучиано')} width={640} height={218} />
            </Link>
            <SheetClose className="icon-button" aria-label={t('Затвори навигацията')}>
              <X size={24} />
            </SheetClose>
          </div>
          <div className="mobile-nav-body">
            <SheetTitle className="sr-only">{t('Основна навигация')}</SheetTitle>
            <SheetDescription className="eyebrow">
              <span />
              {t('Италиански вкус в сърцето на Варна.')}
            </SheetDescription>
            <nav aria-label={t('Мобилна навигация')}>
              {navigation.map((n, i) => (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={close}
                  aria-current={isCurrent(n.href)}
                  style={{ '--i': i } as CSSProperties}
                >
                  <span className="mobile-nav-index" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="mobile-nav-label">{t(n.label)}</span>
                  <ArrowUpRight size={20} aria-hidden="true" />
                </Link>
              ))}
            </nav>
          </div>
          <div className="mobile-nav-footer">
            <div className="mobile-nav-actions">
              <Link className="btn btn-red" href="/reservations/" onClick={close}>
                {t('Резервация')}
                <ArrowUpRight size={17} aria-hidden="true" />
              </Link>
              <a className="btn btn-outline" href={'tel:' + restaurant.phone}>
                <Phone size={16} aria-hidden="true" />
                {t('Обадете се')}
              </a>
            </div>
            <div className="mobile-nav-meta">
              <p>
                {t(restaurant.address)}, {t(restaurant.city)}
                <br />
                {t('Всеки ден · ')}
                {restaurant.hours}
              </p>
              <LanguageSwitcher />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
