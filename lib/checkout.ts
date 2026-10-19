import type { CartLine, MenuCategory, ResolvedLine } from '../types/menu';
import { orderTotal, resolveCart } from './order.ts';

export type CheckoutError = 'invalid' | 'name' | 'phone' | 'items' | 'changed' | 'unavailable' | 'limited' | 'conflict';
export type OrderReceipt = { reference: string; notified: boolean };
export type CheckoutInput = {
  requestId: string;
  name: string;
  phone: string;
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
    notes: v.notes.trim(),
    locale: v.locale,
    lines,
    expectedTotalMinor: v.expectedTotalMinor as number,
  };
}

export function priceCheckout(input: CheckoutInput, menu: MenuCategory[]): ResolvedLine[] {
  const lines = resolveCart(input.lines, menu);
  if (lines.length !== input.lines.length) throw new CheckoutValidationError('changed');
  if (orderTotal(lines) !== input.expectedTotalMinor) throw new CheckoutValidationError('changed');
  return lines;
}
