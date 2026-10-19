import type { CartLine, MenuCategory } from '../types/menu';
import type { LunchWeek } from '../types/lunch';
import { lunchIsOpen, orderingMenu } from './lunch.ts';
import { reconcileCart } from './order.ts';

type LocalTime = { date: string; time: string };
export type CartState = {
  lines: CartLine[];
  menu: MenuCategory[];
  localDateTime: LocalTime | null;
  ready: boolean;
  storageWarning: boolean;
  announcement: 'updated' | CartLine | null;
};
export type CartAction =
  | {
      type: 'restore';
      saved: unknown;
      local: LocalTime;
      storageWarning: boolean;
    }
  | { type: 'refresh'; local: LocalTime }
  | { type: 'add'; items: CartLine[]; local: LocalTime }
  | {
      type: 'change';
      itemId: string;
      variantId: string;
      delta: number;
      local: LocalTime;
    }
  | { type: 'storage-error' };

export function initialCart(menu: MenuCategory[]): CartState {
  return {
    lines: [],
    menu,
    localDateTime: null,
    ready: false,
    storageWarning: false,
    announcement: null,
  };
}

function sameLines(a: CartLine[], b: CartLine[]) {
  return (
    a.length === b.length &&
    a.every(
      (line, i) => line.itemId === b[i].itemId && line.variantId === b[i].variantId && line.quantity === b[i].quantity,
    )
  );
}

export function createCartReducer(regular: MenuCategory[], week: LunchWeek | null) {
  return (state: CartState, action: CartAction): CartState => {
    if (action.type === 'storage-error') return state.storageWarning ? state : { ...state, storageWarning: true };

    const menu =
      lunchIsOpen(week, action.local) === lunchIsOpen(week, state.localDateTime) ?
        state.menu
      : orderingMenu(regular, week, action.local);
    let lines = state.lines;
    let announcement = state.announcement;
    if (action.type === 'restore') {
      lines = reconcileCart(action.saved, menu);
      if (JSON.stringify(action.saved) !== JSON.stringify(lines)) announcement = 'updated';
    } else if (action.type === 'add') {
      lines = reconcileCart([...state.lines, ...action.items], menu);
      announcement = action.items.length === 1 ? action.items[0] : null;
    } else if (action.type === 'change') {
      announcement = null;
      lines = reconcileCart(
        state.lines.map((line) =>
          line.itemId === action.itemId && line.variantId === action.variantId ?
            { ...line, quantity: line.quantity + action.delta }
          : line,
        ),
        menu,
      );
    } else if (menu !== state.menu) {
      lines = reconcileCart(state.lines, menu);
      if (!sameLines(lines, state.lines)) announcement = 'updated';
    }
    // Preserve identity: clock ticks must not trigger cart persistence or tool registration.
    if (sameLines(lines, state.lines)) lines = state.lines;
    const localDateTime =
      state.localDateTime?.date === action.local.date && state.localDateTime.time === action.local.time ?
        state.localDateTime
      : action.local;
    if (action.type === 'refresh' && localDateTime === state.localDateTime && menu === state.menu) return state;
    return {
      ...state,
      lines,
      menu,
      localDateTime,
      announcement,
      ready: action.type === 'restore' || state.ready,
      storageWarning: action.type === 'restore' ? action.storageWarning : state.storageWarning,
    };
  };
}
