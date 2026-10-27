import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import ts from 'typescript';
import { en } from '../i18n/en.ts';
import { getTranslator, localePath, messageKey } from '../i18n/index.ts';
import { getMenu, localizeItem } from '../i18n/content.ts';
import { menu } from '../content/menu.ts';
import { lunchWeek } from '../content/lunch.ts';
import { restaurant, navigation, features } from '../content/restaurant.ts';
import { gallery } from '../content/gallery.ts';
import { money, orderMessage, resolveCart, reservationMessage, validateReservation } from '../lib/order.ts';

const messages: Record<string, string> = en;
const assertTranslated = (text: string) => assert.ok(messages[messageKey(text)], `Missing English: ${text}`);
void test('every UI catalogue call and every published content string has an English translation', () => {
  for (const directory of ['components', 'lib']) {
    const files = readdirSync(directory, { recursive: true }).filter(
      (file) => typeof file === 'string' && /\.tsx?$/.test(file) && !file.startsWith('ui/'),
    ) as string[];
    for (const file of files) {
      const source = ts.createSourceFile(
        file,
        readFileSync(`${directory}/${file}`, 'utf8'),
        ts.ScriptTarget.Latest,
        true,
        file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
      );
      const visit = (node: ts.Node) => {
        if (
          ts.isCallExpression(node) &&
          node.expression.getText(source) === 't' &&
          node.arguments[0] &&
          ts.isStringLiteral(node.arguments[0])
        )
          assertTranslated(node.arguments[0].text);
        ts.forEachChild(node, visit);
      };
      visit(source);
    }
  }
  const walk = (value: unknown) => {
    if (typeof value === 'string' && /[А-Яа-я]/.test(value)) assertTranslated(value);
    else if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === 'object') Object.values(value).forEach(walk);
  };
  walk([menu, lunchWeek, restaurant, navigation, features, gallery]);
  for (const [source, translated] of Object.entries(messages)) {
    assert.ok(translated.trim(), source);
    assert.doesNotMatch(translated, /[А-Яа-я]/, source);
  }
});
void test('translations preserve boundary spaces and localize menu labels without changing IDs or prices', () => {
  const t = getTranslator('en');
  assert.equal(t('Добави '), 'Add ');
  assert.equal(t(' е добавен в поръчката.'), ' has been added to your order.');
  assert.equal(getTranslator('bg')('Добави'), 'Добави');
  const translated = getMenu('en');
  assert.equal(getMenu('bg'), menu);
  assert.equal(getMenu('en'), translated);
  assert.equal(translated[0].items[0].name, 'Margherita');
  for (let c = 0; c < menu.length; c++) {
    for (let i = 0; i < menu[c].items.length; i++) {
      const original = menu[c].items[i],
        english = translated[c].items[i];
      assert.equal(english.id, original.id);
      assert.deepEqual(
        english.variants.map(({ id, priceMinor }) => ({ id, priceMinor })),
        original.variants.map(({ id, priceMinor }) => ({ id, priceMinor })),
      );
    }
  }
  assert.equal(localizeItem(lunchWeek!.items[0], 'en').name, 'Meatball soup');
});
void test('language paths preserve the current route, fragment and query', () => {
  for (const path of ['/', '/menu/', '/lunch/', '/menu/?size=33#pizza-1']) {
    assert.equal(localePath(path, 'bg'), path);
    assert.equal(localePath(localePath(path, 'en'), 'bg'), path);
    assert.equal(localePath(localePath(path, 'en'), 'en'), '/en' + path);
  }
  assert.equal(localePath('/en', 'bg'), '/');
  assert.equal(localePath('/english/', 'bg'), '/english/');
});
void test('English order and reservation handoffs include translated items, validation and EUR formatting', () => {
  const lines = resolveCart([{ itemId: 'pizza-1', variantId: '33', quantity: 2 }], getMenu('en'));
  const message = orderMessage(lines, 'No onions', 'en');
  assert.match(message, /2 × Margherita \(33 cm\)/);
  assert.match(message, /Estimated total:/);
  assert.match(message, /Note: No onions/);
  assert.doesNotMatch(message, /[А-Яа-я]/);
  assert.match(money(1560, 'en'), /15\.60/);
  const reservation = {
    name: 'Jane Doe',
    phone: '+359888123456',
    address: '12 Test Street, Varna',
    guests: 2,
    date: '2026-10-08',
    time: '19:00',
    notes: '',
  };
  assert.match(reservationMessage(reservation, 'en'), /Please confirm the reservation/);
  assert.match(reservationMessage(reservation, 'en'), /Address: 12 Test Street, Varna/);
  assert.equal(
    validateReservation({ ...reservation, address: '' }, new Date('2026-10-06T10:00Z'), 'en'),
    'Please enter an address (5–300 characters).',
  );
  assert.equal(
    validateReservation({ ...reservation, name: '' }, new Date('2026-10-06T10:00Z'), 'en'),
    'Please enter your name.',
  );
});
