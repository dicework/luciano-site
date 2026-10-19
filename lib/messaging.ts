import { restaurant } from '../content/restaurant.ts';

export function internationalNumber(phone: string) {
  const number = phone.replace(/[\s()+-]/g, '').replace(/^00/, '');
  if (!/^[1-9]\d{7,14}$/.test(number)) {
    throw new Error('Messaging requires a phone number with its country code.');
  }
  return number;
}

export function whatsappLink(message: string, phone: string = restaurant.whatsappNumber) {
  return `https://wa.me/${internationalNumber(phone)}?text=${encodeURIComponent(message)}`;
}

export function viberLink(
  message: string,
  contact: {
    phone: string;
    account: 'personal' | 'business';
  } = restaurant.viber,
) {
  const number = internationalNumber(contact.phone);
  // Viber's HTTPS draft links work only for registered Business accounts.
  if (contact.account === 'business') {
    return `https://viber.me/${number}?draft=${encodeURIComponent(message)}`;
  }
  // Personal chats need the text pasted manually; support varies by device.
  return `viber://chat?number=${encodeURIComponent('+' + number)}`;
}
