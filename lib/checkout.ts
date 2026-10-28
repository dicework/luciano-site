import type { CartLine, MenuCategory, ResolvedLine } from '../types/menu';
import { orderTotal, resolveCart } from './order.ts';

export const MINIMUM_ORDER_MINOR = 1500;

export const checkoutErrors = {
  invalid: 'invalid',
  name: 'name',
  phone: 'phone',
  address: 'address',
  items: 'items',
  minimum: 'minimum',
  changed: 'changed',
  unavailable: 'unavailable',
  limited: 'limited',
  conflict: 'conflict',
} as const;
export type CheckoutError = (typeof checkoutErrors)[keyof typeof checkoutErrors];
export type OrderReceipt = { reference: string; notified: boolean };
export type CheckoutInput = {
  requestId: string;
  name: string;
  phone: string;
  address: string;
  notes: string;
  locale: 'bg' | 'en';
  lines: CartLine[];
  expectedTotalMinor: number;
};

export class CheckoutValidationError extends Error {
  code: CheckoutError;
  constructor(code: CheckoutError) {
    super(code);
    this.code = code;
  }
}

export function parseCheckout(value: unknown): CheckoutInput {
  const fail = (code: CheckoutError): never => {
    throw new CheckoutValidationError(code);
  };
  if (!value || typeof value !== 'object') return fail('invalid');
  const v = value as Record<string, unknown>;
  if (
    typeof v.requestId !== 'string' ||
    !/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(v.requestId)
  )
    return fail('invalid');
  if (typeof v.name !== 'string' || v.name.trim().length < 2 || v.name.length > 80 || /[\r\n\x00-\x1f]/.test(v.name))
    return fail('name');
  if (
    typeof v.phone !== 'string' ||
    !/^\+?[\d\s()-]{7,25}$/.test(v.phone) ||
    !/^\d{7,15}$/.test(v.phone.replace(/\D/g, ''))
  )
    return fail('phone');
  if (
    typeof v.address !== 'string' ||
    v.address.trim().length < 5 ||
    v.address.length > 300 ||
    // eslint-disable-next-line no-control-regex -- Prevent control characters from forging notification lines.
    /[\x00-\x1f\x7f]/.test(v.address)
  )
    return fail('address');
  if (typeof v.notes !== 'string' || v.notes.length > 500 || /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(v.notes))
    return fail('invalid');
  if (v.locale !== 'bg' && v.locale !== 'en') return fail('invalid');
  if (!Number.isSafeInteger(v.expectedTotalMinor) || (v.expectedTotalMinor as number) <= 0) return fail('invalid');
  if (!Array.isArray(v.lines) || v.lines.length === 0 || v.lines.length > 30) return fail('items');
  const seen = new Set<string>();
  let count = 0;
  const lines = v.lines.map((raw: unknown) => {
    if (!raw || typeof raw !== 'object') return fail('items');
    const line = raw as Record<string, unknown>;
    if (
      typeof line.itemId !== 'string' ||
      typeof line.variantId !== 'string' ||
      line.itemId.length > 100 ||
      line.variantId.length > 100 ||
      !Number.isInteger(line.quantity) ||
      (line.quantity as number) < 1 ||
      (line.quantity as number) > 99
    )
      return fail('items');
    const key = JSON.stringify([line.itemId, line.variantId]);
    if (seen.has(key)) return fail('items');
    seen.add(key);
    count += line.quantity as number;
    return { itemId: line.itemId, variantId: line.variantId, quantity: line.quantity as number };
  });
  if (count > 99) return fail('items');
  return {
    requestId: v.requestId.toLowerCase(),
    name: v.name.trim(),
    phone: v.phone.replace(/[\s()-]/g, ''),
    address: v.address.trim(),
    notes: v.notes.trim(),
    locale: v.locale,
    lines,
    expectedTotalMinor: v.expectedTotalMinor as number,
  };
}

export function priceCheckout(input: CheckoutInput, menu: MenuCategory[]): ResolvedLine[] {
  const lines = resolveCart(input.lines, menu);
  if (lines.length !== input.lines.length) throw new CheckoutValidationError('changed');
  const total = orderTotal(lines);
  if (total !== input.expectedTotalMinor) throw new CheckoutValidationError('changed');
  if (total < MINIMUM_ORDER_MINOR) throw new CheckoutValidationError('minimum');
  return lines;
}
