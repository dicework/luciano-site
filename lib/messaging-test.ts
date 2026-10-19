import { internationalNumber } from './messaging.ts';

export const messagingTestKey = 'luchiano-messaging-test';

export function readMessagingTest(hash: string, storedPhone: string | null) {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const requested = params.has('test-phone') ? params.get('test-phone') : storedPhone;
  if (requested === null || requested === 'off') return { phone: null, error: false };
  try {
    return { phone: '+' + internationalNumber(requested), error: false };
  } catch {
    // A broken test link must not silently send someone to the restaurant.
    return { phone: null, error: true };
  }
}
