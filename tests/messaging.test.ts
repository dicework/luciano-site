import { test } from 'node:test';
import assert from 'node:assert/strict';
import { restaurant } from '../content/restaurant.ts';
import { viberLink, whatsappLink } from '../lib/messaging.ts';
import { readMessagingTest } from '../lib/messaging-test.ts';

void test('test recipients survive navigation, can be replaced, and explicitly exit', () => {
  const phone = '+359888123456';
  assert.deepEqual(readMessagingTest('#test-phone=359888123456', null), { phone, error: false });
  assert.deepEqual(readMessagingTest('#pizza', phone), { phone, error: false });
  assert.deepEqual(readMessagingTest('', phone), { phone, error: false });
  assert.deepEqual(readMessagingTest('#test-phone=359888654321', phone), {
    phone: '+359888654321',
    error: false,
  });
  assert.deepEqual(readMessagingTest('#test-phone=off', phone), { phone: null, error: false });
  assert.deepEqual(readMessagingTest('', null), { phone: null, error: false });
});

void test('invalid test links block messaging instead of selecting the restaurant', () => {
  for (const hash of ['#test-phone=', '#test-phone=oops', '#test-phone=0888123456']) {
    assert.deepEqual(readMessagingTest(hash, '+359888123456'), { phone: null, error: true });
  }
  assert.deepEqual(readMessagingTest('', 'invalid'), { phone: null, error: true });
});

void test('WhatsApp targets the configured number and preserves the entire draft', () => {
  const message = 'Поръчка 🍕\nБез лук & сос? + extra #1 / 50%';
  const url = new URL(whatsappLink(message));
  assert.equal(url.origin, 'https://wa.me');
  assert.equal(url.pathname, '/' + restaurant.whatsappNumber.replace('+', ''));
  assert.deepEqual([...url.searchParams], [['text', message]]);
  assert.equal(url.hash, '');
  for (const phone of ['+359 (88) 609-4164', '00359 88 609 4164', '359886094164']) {
    assert.equal(new URL(whatsappLink(message, phone)).pathname, '/359886094164');
  }
  for (const phone of ['', '0886094164', '+359badnumber', '359886094164?text=x']) {
    assert.throws(() => whatsappLink(message, phone));
  }
});

void test('Viber Business links prefill localized drafts while personal links target only the phone', () => {
  const phone = '+359 88 609 4164';
  for (const message of ['Здравейте!\nМаса за двама & 🍕?', 'Hello!\nA table for two & pizza?']) {
    const business = new URL(viberLink(message, { phone, account: 'business' }));
    assert.equal(business.origin, 'https://viber.me');
    assert.equal(business.pathname, '/359886094164');
    assert.deepEqual([...business.searchParams], [['draft', message]]);
    const personal = new URL(viberLink(message, { phone, account: 'personal' }));
    assert.equal(personal.protocol, 'viber:');
    assert.equal(personal.hostname, 'chat');
    assert.deepEqual([...personal.searchParams], [['number', '+359886094164']]);
  }
});
