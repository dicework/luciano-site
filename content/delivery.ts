// Neighbourhoods drawn on the delivery map. Regenerate the map with scripts/delivery-map/ (see docs/delivery-map.md).
export const deliveryZones = [
  'Център',
  'Гръцка махала',
  'Фестивален комплекс',
  'Червен площад',
  'Колхозен пазар',
  'Окръжна болница',
  'Генералите',
  'Чаталджа',
  'Спортна зала',
  'Левски',
  'Трошево',
] as const;

export const deliveryMap = {
  path: '/images/delivery/delivery-zones-',
  width: 2400,
  height: 1600,
  attributionUrl: 'https://www.openstreetmap.org/copyright',
} as const;
