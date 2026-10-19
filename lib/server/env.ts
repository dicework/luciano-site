// Services also accept incomplete configuration so unavailable integrations fail closed.
export interface RestaurantEnv extends Partial<Omit<CloudflareBindings, 'ORDERS_ENABLED' | 'RESERVATIONS_ENABLED'>> {
  ORDERS_ENABLED?: string;
  RESERVATIONS_ENABLED?: string;
  CALLMEBOT_PHONE?: string;
  CALLMEBOT_API_KEY?: string;
}
