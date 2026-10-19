import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCartReducer, initialCart } from '../lib/cart.ts';
import { menu } from '../content/menu.ts';
import { lunchWeek } from '../content/lunch.ts';

const reducer = createCartReducer(menu, lunchWeek);
const during = { date: '2026-10-06', time: '12:00' };
const restore = (saved: unknown) =>
  reducer(initialCart(menu), {
    type: 'restore',
    saved,
    local: during,
    storageWarning: false,
  });
const pizza = { itemId: 'pizza-1', variantId: '33', quantity: 2 };
const lunch = {
  itemId: lunchWeek!.items[0].id,
  variantId: 'regular',
  quantity: 1,
};

void test('restores and validates storage against the current serving window', () => {
  const state = restore([pizza, lunch, { itemId: 'removed', variantId: 'x', quantity: 1 }]);
  assert.equal(state.ready, true);
  assert.deepEqual(state.lines, [pizza, lunch]);
  assert.equal(state.announcement, 'updated');
  assert.deepEqual(restore({ invalid: true }).lines, []);
});

void test('clock refreshes preserve menu and cart references until availability changes', () => {
  const state = restore([pizza, lunch]);
  assert.equal(reducer(state, { type: 'refresh', local: during }), state);
  const later = reducer(state, {
    type: 'refresh',
    local: { ...during, time: '12:01' },
  });
  assert.equal(later.lines, state.lines);
  assert.equal(later.menu, state.menu);
  const closed = reducer(later, {
    type: 'refresh',
    local: { ...during, time: '15:00' },
  });
  assert.deepEqual(closed.lines, [pizza]);
  assert.equal(closed.announcement, 'updated');
  assert.equal(closed.menu, menu);
  const tomorrow = reducer(closed, {
    type: 'refresh',
    local: { date: '2026-10-07', time: '12:00' },
  });
  assert.deepEqual(tomorrow.lines, [pizza]); // expired selections never return
});

void test('edits merge quantities, cap them, remove zero quantities and use the action time', () => {
  const state = restore([pizza]);
  const added = reducer(state, {
    type: 'add',
    items: [{ ...pizza, quantity: 98 }],
    local: during,
  });
  assert.equal(added.lines[0].quantity, 99);
  const noChange = reducer(added, {
    type: 'change',
    itemId: pizza.itemId,
    variantId: pizza.variantId,
    delta: 1,
    local: during,
  });
  assert.equal(noChange.lines, added.lines);
  const removed = reducer(added, {
    type: 'change',
    itemId: pizza.itemId,
    variantId: pizza.variantId,
    delta: -99,
    local: during,
  });
  assert.deepEqual(removed.lines, []);
  assert.equal(removed.announcement, null);
  const expired = reducer(state, {
    type: 'add',
    items: [lunch],
    local: { ...during, time: '15:00' },
  });
  assert.deepEqual(expired.lines, [pizza]);
});

void test('storage failures preserve the in-memory cart and repeated warnings are no-ops', () => {
  const state = restore([pizza]);
  const warned = reducer(state, { type: 'storage-error' });
  assert.equal(warned.lines, state.lines);
  assert.equal(warned.storageWarning, true);
  assert.equal(reducer(warned, { type: 'storage-error' }), warned);
});
