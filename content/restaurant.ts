const phone = '+359886094164';

export const restaurant = {
  name: 'Лучиано',
  // Spellings guests search for: the sign reads „Пицария Лучиано“, Instagram uses Luciano.
  alternateNames: ['Пицария Лучиано', 'Лучиано', 'Luchiano', 'Luciano'],
  logo: '/images/brand/luchiano-logo.jpg',
  phone,
  displayPhone: '+359 88 609 4164',
  whatsappNumber: phone,
  viber: {
    phone,
    // Enable only after confirming this number has a Viber Business account.
    account: 'personal' as 'personal' | 'business',
  },
  address: 'ул. „Русе“ 13',
  city: 'Варна',
  postalCode: '9000',
  // Pin of the restaurant's Google Maps listing.
  geo: { latitude: 43.2033091, longitude: 27.9116265 },
  hours: '08:00-22:00',
  instagram: 'https://www.instagram.com/luciano_pizzaa/',
  instagramHandle: '@luciano_pizzaa',
  mapUrl: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Ресторант Лучиано, Русе 13, Варна'),
  mapEmbed:
    'https://maps.google.com/maps?q=' + encodeURIComponent('Ресторант Лучиано, Русе 13, Варна') + '&output=embed',
  mapListingUrl: 'https://maps.google.com/?cid=1315426167596723749',
  siteUrl: 'https://luchianopizza.com',
  currency: 'EUR',
} as const;
export const navigation = [
  { href: '/', label: 'Начало' },
  { href: '/about/', label: 'За нас' },
  { href: '/menu/', label: 'Меню' },
  { href: '/lunch/', label: 'Обедно меню' },
  { href: '/gallery/', label: 'Галерия' },
  { href: '/contact/', label: 'Контакти' },
];
export const features = [
  {
    number: '01',
    title: 'Неаполитански пици на пещ',
    text: 'Тънък блат, подбрани продукти и аромат направо от пещта.',
  },
  {
    number: '02',
    title: 'Домашни пасти и предястия',
    text: 'Италиански класики, предястия и вкусове за споделяне.',
  },
  {
    number: '03',
    title: 'Барбекю и риба на скара',
    text: 'Жар, свежи съставки и още нещо любимо на масата.',
  },
  {
    number: '04',
    title: 'Коктейли и бар в центъра на Варна',
    text: 'Бар в центъра на Варна. За наздравици със и без повод.',
  },
];
