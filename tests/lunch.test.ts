import { test } from 'node:test';
import assert from 'node:assert/strict';
import { visibleLunchWeek, orderingMenu } from '../lib/lunch.ts';
import { menu } from '../content/menu.ts';
import type { LunchWeek } from '../types/lunch.ts';
import { reconcileCart, resolveCart, orderMessage } from '../lib/order.ts';

const soup = {
  id: 'lunch-2026-10-06-soup',
  name: 'Супа',
  description: '',
  tags: [],
  variants: [{ id: 'regular', label: '300 мл', priceMinor: 350 }],
};
const week: LunchWeek = {
  validFrom: '2026-10-05',
  validUntil: '2026-10-09',
  weekdays: [1, 2, 3, 4, 5],
  hours: { from: '11:00', until: '15:00' },
  items: [soup],
};

void test('lunch orders use the serving date and hours; expired saved items disappear', () => {
  const cart = [{ itemId: soup.id, variantId: 'regular', quantity: 2 }];
  for (const local of [
    { date: '2026-10-04', time: '12:00' },
    { date: '2026-10-06', time: '10:59' },
    { date: '2026-10-06', time: '15:00' },
    { date: '2026-10-10', time: '12:00' },
  ]) {
    assert.deepEqual(reconcileCart(cart, orderingMenu(menu, week, local)), []);
  }
  const active = orderingMenu(menu, week, {
    date: '2026-10-06',
    time: '11:30',
  });
  const resolved = resolveCart(cart, active);
  assert.equal(resolved[0].priceMinor, 350);
  assert.match(orderMessage(resolved), /2 × Супа/);
  assert.match(orderMessage(resolved), /7,00/);
});

void test('one weekly menu is available each weekday and expires without rolling forward', () => {
  assert.equal(visibleLunchWeek(null, '2026-10-06'), null);
  assert.equal(visibleLunchWeek(week, null), null);
  assert.equal(visibleLunchWeek(week, '2026-10-10'), null);
  assert.equal(visibleLunchWeek(week, '2026-10-06'), week);
  for (const date of ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09']) {
    const active = orderingMenu(menu, week, { date, time: '12:00' });
    assert.equal(active.at(-1)?.items[0].id, soup.id);
  }
  const extended = { ...week, validUntil: '2026-10-11' };
  assert.equal(orderingMenu(menu, extended, { date: '2026-10-10', time: '12:00' }), menu);
  assert.equal(orderingMenu(menu, null, null), menu);
});
