'use client';
import { localizeMenu } from '@/i18n/content';
import { useI18n } from '@/components/i18n/language-provider';
import { createContext, useContext, useReducer, useState, useEffect, useCallback, useMemo } from 'react';
import { flushSync } from 'react-dom';
import { menu as regularMenu } from '@/content/menu';
import { lunchWeek } from '@/content/lunch';
import { orderingMenu } from '@/lib/lunch';
import { initialCart, createCartReducer } from '@/lib/cart';
import type { CartLine } from '@/types/menu';
import { orderTotal, reconcileCart, resolveCart, sofiaDateTime } from '@/lib/order';
import { deliveryQuote } from '@/lib/delivery';
import { CartSheet } from './cart-sheet';
import { deliveryStatus } from './delivery-summary';
import { useCartTools } from './use-cart-tools';

const STORAGE = 'luchiano-cart-v1';
const reducer = createCartReducer(regularMenu, lunchWeek);
interface CartActions {
  add: (itemId: string, variantId: string) => boolean;
  setOpen: (open: boolean) => void;
}
const Context = createContext<(CartActions & { count: number }) | null>(null);
const ActionsContext = createContext<CartActions | null>(null);
const TimeContext = createContext<{ date: string; time: string } | null>(null);
export function useCart() {
  const value = useContext(Context);
  if (!value) throw new Error('Cart provider missing');
  return value;
}
export function useCartActions() {
  const value = useContext(ActionsContext);
  if (!value) throw new Error('Cart provider missing');
  return value;
}
export const useRestaurantTime = () => useContext(TimeContext);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { locale, t } = useI18n();
  const [state, dispatch] = useReducer(reducer, regularMenu, initialCart);
  const [open, setOpen] = useState(false);
  const { lines, menu, ready, localDateTime, storageWarning } = state;
  useEffect(() => {
    let saved: unknown = [];
    let storageWarning = false;
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE) ?? '[]');
    } catch {
      storageWarning = true;
    }
    dispatch({
      type: 'restore',
      saved,
      local: sofiaDateTime(),
      storageWarning,
    });
    const refresh = () => dispatch({ type: 'refresh', local: sofiaDateTime() });
    const timer = window.setInterval(refresh, 30_000);
    window.addEventListener('focus', refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE, JSON.stringify(lines));
    } catch {
      dispatch({ type: 'storage-error' });
    }
  }, [lines, ready]);

  const add = useCallback((itemId: string, variantId: string) => {
    const local = sofiaDateTime();
    const items = reconcileCart([{ itemId, variantId, quantity: 1 }], orderingMenu(regularMenu, lunchWeek, local));
    if (!items.length) {
      dispatch({ type: 'refresh', local });
      return false;
    }
    dispatch({ type: 'add', items, local });
    return true;
  }, []);
  // Called only by registered browser tools, reading the latest cart without re-registering on every edit.
  const stage = (items: CartLine[]) => {
    const action = { type: 'add' as const, items, local: sofiaDateTime() };
    const currentMenu = orderingMenu(regularMenu, lunchWeek, action.local);
    if (items.some((item) => reconcileCart([item], currentMenu).length !== 1))
      throw new Error(t('Артикулът не е наличен.'));
    const next = reducer(state, action);
    flushSync(() => {
      dispatch(action);
      setOpen(true);
    });
    return next.lines;
  };
  const translatedMenu = useMemo(() => localizeMenu(menu, locale), [menu, locale]);
  useCartTools(ready, translatedMenu, stage);
  const resolved = useMemo(() => resolveCart(lines, translatedMenu), [lines, translatedMenu]);
  const count = resolved.reduce((sum, line) => sum + line.quantity, 0);
  const actions = useMemo(() => ({ add, setOpen }), [add]);
  const value = useMemo(() => ({ ...actions, count }), [actions, count]);
  const announced = state.announcement;
  const announcement =
    announced === 'updated' ? t('Поръчката е обновена спрямо наличното меню.')
    : announced ?
      (resolved.find((line) => line.itemId === announced.itemId)?.name ?? '') +
      t(' е добавен в поръчката.') +
      ' ' +
      deliveryStatus(deliveryQuote(orderTotal(resolved)), t, locale)
    : '';
  return (
    <Context.Provider value={value}>
      <ActionsContext.Provider value={actions}>
        <TimeContext.Provider value={localDateTime}>
          {children}
          <CartSheet
            resolved={resolved}
            open={open}
            setOpen={setOpen}
            announcement={announcement}
            added={announced && announced !== 'updated' ? announced : null}
            storageWarning={storageWarning}
            change={(itemId, variantId, delta) =>
              dispatch({
                type: 'change',
                itemId,
                variantId,
                delta,
                local: sofiaDateTime(),
              })
            }
          />
        </TimeContext.Provider>
      </ActionsContext.Provider>
    </Context.Provider>
  );
}
