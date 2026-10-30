// Delivery terms shared by the cart, checkout and order API. Amounts are euro cents of the menu items.
export const MINIMUM_ORDER_MINOR = 1200;
export const DELIVERY_FEE_MINOR = 150;
export const FREE_DELIVERY_FROM_MINOR = 2000;

export type DeliveryQuote = {
  itemsMinor: number;
  deliveryMinor: number;
  totalMinor: number;
  toMinimumMinor: number;
  toFreeDeliveryMinor: number;
};

export function deliveryQuote(itemsMinor: number): DeliveryQuote {
  const deliveryMinor = itemsMinor >= FREE_DELIVERY_FROM_MINOR ? 0 : DELIVERY_FEE_MINOR;
  return {
    itemsMinor,
    deliveryMinor,
    totalMinor: itemsMinor + deliveryMinor,
    toMinimumMinor: Math.max(0, MINIMUM_ORDER_MINOR - itemsMinor),
    toFreeDeliveryMinor: Math.max(0, FREE_DELIVERY_FROM_MINOR - itemsMinor),
  };
}
