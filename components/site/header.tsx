'use client';
import { useI18n } from '@/components/i18n/language-provider';
import Link from '@/components/i18n/localized-link';
import { LanguageSwitcher } from '@/components/i18n/language-switcher';
import { localePath } from '@/i18n';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import Image from 'next/image';
import { Menu, X, ShoppingBag, Phone } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle, SheetDescription, SheetClose } from '@/components/ui/sheet';
import { navigation, restaurant } from '@/content/restaurant';
import { useCart } from '@/components/cart/cart-provider';
export function Header() {
  const { locale, t } = useI18n();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const cart = useCart();
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
              <Link
                key={n.href}
                href={n.href}
                aria-current={
                  path.replace(/\/$/, '') === localePath(n.href, locale).replace(/\/$/, '') ? 'page' : undefined
                }
              >
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
          >
            <Menu size={24} />
          </button>
        </div>
      </header>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent showCloseButton={false} className="mobile-nav !w-full !max-w-sm">
          <SheetClose className="icon-button close-button" aria-label={t('Затвори навигацията')}>
            <X />
          </SheetClose>
          <SheetTitle className="!text-3xl !font-normal">{t('Добре дошли.')}</SheetTitle>
          <SheetDescription>{t('Италиански вкус в сърцето на Варна.')}</SheetDescription>
          <nav aria-label={t('Мобилна навигация')}>
            {navigation.map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)}>
                {t(n.label)}
                <span>↗</span>
              </Link>
            ))}
            <Link href="/reservations/" onClick={() => setOpen(false)}>
              {t('Резервация')}
              <span>↗</span>
            </Link>
          </nav>
          <a className="btn btn-green" href={'tel:' + restaurant.phone}>
            {restaurant.displayPhone}
          </a>
          <p>
            {t(restaurant.address)}, {t(restaurant.city)}
            <br />
            {t('Всеки ден · ')}
            {restaurant.hours}
          </p>
        </SheetContent>
      </Sheet>
    </>
  );
}
