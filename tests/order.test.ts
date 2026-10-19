import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  reconcileCart,
  resolveCart,
  orderTotal,
  orderMessage,
  validateReservation,
  sofiaDateTime,
  reservationMessage,
} from '../lib/order.ts';
import { whatsappLink } from '../lib/messaging.ts';
import { menu } from '../content/menu.ts';
import type { MenuCategory } from '../types/menu.ts';
const fixture: MenuCategory[] = [
  {
    id: 'pizza',
    name: 'Пици',
    items: [
      {
        id: 'pizza-1',
        name: 'Маргарита',
        description: '',
        tags: [],
        variants: [
          { id: '26', label: '26 см', priceMinor: 710 },
          { id: '33', label: '33 см', priceMinor: 780 },
          { id: '50', label: '50 см', priceMinor: 1190, available: false },
        ],
      },
      {
        id: 'gone',
        name: 'Unavailable',
        description: '',
        tags: [],
        available: false,
        variants: [{ id: 'one', label: 'Порция', priceMinor: 500 }],
      },
    ],
  },
];
void test('menu IDs and prices are valid and uniquely addressable', () => {
  const ids = new Set<string>();
  assert.equal(
    menu.reduce((n, c) => n + c.items.length, 0),
    79,
  );
  for (const c of menu) {
    assert.ok(c.items.length);
    for (const item of c.items) {
      assert.ok(!ids.has(item.id));
      ids.add(item.id);
      assert.ok(item.variants.length);
      const variants = new Set();
      for (const v of item.variants) {
        assert.ok(!variants.has(v.id));
        variants.add(v.id);
        assert.ok(Number.isInteger(v.priceMinor) && v.priceMinor >= 0);
      }
    }
  }
  assert.ok(menu.find((c) => c.id === 'pizza')!.items.every((i) => i.variants.length === 3));
});
void test('restoring cart discards malformed, unavailable and removed variants', () => {
  const lines = reconcileCart(
    [
      null,
      { itemId: 'gone', variantId: 'one', quantity: 1 },
      { itemId: 'pizza-1', variantId: '50', quantity: 1 },
      { itemId: 'missing', variantId: 'x', quantity: 2 },
      { itemId: 'pizza-1', variantId: '26', quantity: -1 },
      { itemId: 'pizza-1', variantId: '26', quantity: 1.5 },
      { itemId: 'pizza-1', variantId: '26', quantity: '2' },
      { itemId: 'pizza-1', variantId: '33', quantity: 2 },
    ],
    fixture,
  );
  assert.deepEqual(lines, [{ itemId: 'pizza-1', variantId: '33', quantity: 2 }]);
  assert.deepEqual(reconcileCart({}, fixture), []);
});
void test('duplicate variants merge, different sizes stay separate and quantity is capped', () => {
  const result = reconcileCart(
    [
      { itemId: 'pizza-1', variantId: '26', quantity: 80 },
      { itemId: 'pizza-1', variantId: '26', quantity: 50 },
      { itemId: 'pizza-1', variantId: '33', quantity: 1 },
    ],
    fixture,
  );
  assert.equal(result[0].quantity, 99);
  assert.equal(result.length, 2);
});
void test('totals use current menu prices and integer arithmetic', () => {
  const lines = resolveCart(
    [
      { itemId: 'pizza-1', variantId: '26', quantity: 2 },
      { itemId: 'pizza-1', variantId: '33', quantity: 1 },
    ],
    fixture,
  );
  assert.equal(orderTotal(lines), 2200);
  const revised = structuredClone(fixture);
  revised[0].items[0].variants[0].priceMinor = 750;
  assert.equal(orderTotal(resolveCart(lines, revised)), 2280);
});
void test('Bulgarian order message survives URL encoding with special notes', () => {
  const lines = resolveCart([{ itemId: 'pizza-1', variantId: '33', quantity: 2 }], fixture);
  const text = orderMessage(lines, 'Без лук & повече сос?');
  const url = new URL(whatsappLink(text));
  assert.equal(url.hostname, 'wa.me');
  assert.equal(url.pathname, '/359886094164');
  assert.equal(url.searchParams.get('text'), text);
  assert.match(text, /2 × Маргарита \(33 см\)/);
  assert.match(text, /15,60/);
  assert.match(text, /потвърдете/);
  assert.throws(() => orderMessage([]));
});
const reservation = {
  name: 'Иван Иванов',
  phone: '+359 888 123 456',
  guests: 2,
  date: '2026-09-07',
  time: '19:00',
  notes: 'Детско столче',
};
void test('reservation validation respects Sofia date and working hours', () => {
  const now = new Date('2026-09-06T18:00:00Z');
  assert.equal(validateReservation(reservation, now), null);
  assert.ok(validateReservation({ ...reservation, date: '2026-09-06', time: '20:00' }, now));
  assert.ok(validateReservation({ ...reservation, time: '22:00' }, now));
  assert.ok(validateReservation({ ...reservation, time: '19:99' }, now));
  assert.ok(validateReservation({ ...reservation, date: '2026-02-30' }, now));
  assert.ok(validateReservation({ ...reservation, guests: 0 }, now));
  assert.ok(validateReservation({ ...reservation, phone: 'abc' }, now));
  assert.match(reservationMessage(reservation), /07.09.2026/);
  assert.match(reservationMessage(reservation), /Моля, потвърдете/);
});
void test('Sofia local date handles midnight and daylight saving changes', () => {
  assert.deepEqual(sofiaDateTime(new Date('2026-09-06T22:30:00Z')), {
    date: '2026-09-07',
    time: '01:30',
  });
  assert.equal(sofiaDateTime(new Date('2026-01-06T18:00:00Z')).time, '20:00');
});
