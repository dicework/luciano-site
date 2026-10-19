'use client';
import { useI18n } from '@/components/i18n/language-provider';
import { useState } from 'react';
import { ShoppingBag, Minus, Plus, X, Trash2, ArrowRight } from 'lucide-react';
import Link from '@/components/i18n/localized-link';
import { Sheet, SheetContent, SheetTitle, SheetDescription, SheetClose } from '@/components/ui/sheet';
import type { ResolvedLine } from '@/types/menu';
import { money, orderTotal } from '@/lib/order';
import { CheckoutForm } from '@/components/cart/checkout-form';
import type { OrderReceipt } from '@/lib/checkout';
export function CartSheet({
  resolved,
  open,
  setOpen,
  announcement,
  storageWarning,
  change,
}: {
  resolved: ResolvedLine[];
  open: boolean;
  setOpen: (open: boolean) => void;
  announcement: string;
  storageWarning: boolean;
  change: (itemId: string, variantId: string, delta: number) => void;
}) {
  const { locale, t } = useI18n();
  const [receipt, setReceipt] = useState<OrderReceipt | null>(null);
  const count = resolved.reduce((sum, line) => sum + line.quantity, 0);
  return (
    <>
      <output className="sr-only" aria-live="polite">
        {announcement}
      </output>
      {count > 0 && (
        <button className="mobile-cart-bar" onClick={() => setOpen(true)}>
          <ShoppingBag size={19} />
          <span>
            {t('Моята поръчка · ')}
            {count}
          </span>
          <strong>{money(orderTotal(resolved), locale)}</strong>
          <ArrowRight size={19} />
        </button>
      )}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent showCloseButton={false} className="cart-sheet !w-full !max-w-lg">
          <SheetClose className="icon-button close-button" aria-label={t('Затвори поръчката')}>
            <X />
          </SheetClose>
          <SheetTitle className="!text-4xl !font-normal">{t('На вашата маса.')}</SheetTitle>
          <SheetDescription>{t('Вашата поръчка в Лучиано')}</SheetDescription>
          {count === 0 && !receipt ?
            <div className="empty-cart">
              <ShoppingBag size={44} strokeWidth={1} />
              <h3>{t('Нещо вкусно?')}</h3>
              <p>{t('Добавете любимите си ястия от менюто.')}</p>
              <Link className="btn btn-red" href="/menu/" onClick={() => setOpen(false)}>
                {t('Разгледай менюто ')}
                <ArrowRight size={17} />
              </Link>
            </div>
          : <div className="cart-body">
              {storageWarning && (
                <output className="notice">
                  {t('Поръчката е достъпна в тази страница, но браузърът не позволява запазване.')}
                </output>
              )}
              {!receipt && (
                <>
                  <div className="cart-lines">
                    {resolved.map((l) => (
                      <div className="cart-line" key={l.itemId + l.variantId}>
                        <div>
                          <h3>{l.name}</h3>
                          <p>{l.variantLabel}</p>
                          <div className="quantity">
                            <button
                              onClick={() => change(l.itemId, l.variantId, -1)}
                              aria-label={t('Намали ') + l.name}
                            >
                              <Minus size={14} />
                            </button>
                            <span>{l.quantity}</span>
                            <button
                              disabled={l.quantity >= 99}
                              onClick={() => change(l.itemId, l.variantId, 1)}
                              aria-label={t('Увеличи ') + l.name}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                        <div className="line-price">
                          <strong>{money(l.priceMinor * l.quantity, locale)}</strong>
                          <button
                            className="icon-button"
                            onClick={() => change(l.itemId, l.variantId, -l.quantity)}
                            aria-label={t('Премахни ') + l.name}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="cart-total">
                    <span>{t('Ориентировъчна сума')}</span>
                    <strong>{money(orderTotal(resolved), locale)}</strong>
                  </div>
                  <p className="small">
                    {t(
                      'Наличностите, получаването и крайната сума се уточняват с ресторанта. Поръчката е приета след потвърждение.',
                    )}
                  </p>
                </>
              )}
              <CheckoutForm
                lines={resolved}
                receipt={receipt}
                onSubmitted={(result, submittedLines) => {
                  setReceipt(result);
                  submittedLines.forEach((line) => change(line.itemId, line.variantId, -line.quantity));
                }}
                onNewOrder={() => setReceipt(null)}
              />
            </div>
          }
        </SheetContent>
      </Sheet>
    </>
  );
}
