'use client';
import { useI18n } from '@/components/i18n/language-provider';
import { useEffect, useState } from 'react';
import { ShoppingBag, Minus, Plus, X, Trash2, ArrowRight, Check } from 'lucide-react';
import Link from '@/components/i18n/localized-link';
import { Sheet, SheetContent, SheetTitle, SheetDescription, SheetClose } from '@/components/ui/sheet';
import type { CartLine, ResolvedLine } from '@/types/menu';
import { money, orderTotal } from '@/lib/order';
import { deliveryQuote } from '@/lib/delivery';
import { CheckoutForm } from '@/components/cart/checkout-form';
import { DeliverySummary, deliveryStatus } from '@/components/cart/delivery-summary';
import type { OrderReceipt } from '@/lib/checkout';
export function CartSheet({
  resolved,
  open,
  setOpen,
  announcement,
  added,
  storageWarning,
  change,
}: {
  resolved: ResolvedLine[];
  open: boolean;
  setOpen: (open: boolean) => void;
  announcement: string;
  added: CartLine | null;
  storageWarning: boolean;
  change: (itemId: string, variantId: string, delta: number) => void;
}) {
  const { locale, t } = useI18n();
  const [receipt, setReceipt] = useState<OrderReceipt | null>(null);
  const [dismissed, setDismissed] = useState<CartLine | null>(null);
  const count = resolved.reduce((sum, line) => sum + line.quantity, 0);
  const quote = deliveryQuote(orderTotal(resolved));
  // Each dish added from the menu briefly confirms itself with the delivery progress.
  const addedName =
    added && added !== dismissed && !open ?
      resolved.find((line) => line.itemId === added.itemId && line.variantId === added.variantId)?.name
    : undefined;
  useEffect(() => {
    if (!added) return;
    const timer = window.setTimeout(() => setDismissed(added), 5000);
    return () => window.clearTimeout(timer);
  }, [added]);
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
            <small>{deliveryStatus(quote, t, locale, true)}</small>
          </span>
          <strong>{money(quote.totalMinor, locale)}</strong>
          <ArrowRight size={19} />
        </button>
      )}
      {addedName && (
        <div className="cart-toast" aria-hidden="true">
          <Check size={18} />
          <p>
            <strong>
              {addedName}
              {t(' е добавен в поръчката.')}
            </strong>
            <span>{deliveryStatus(quote, t, locale)}</span>
          </p>
          <button
            type="button"
            tabIndex={-1}
            onClick={() => {
              setDismissed(added);
              setOpen(true);
            }}
          >
            {t('Виж поръчката')}
          </button>
        </div>
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
                  <DeliverySummary quote={quote} />
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
