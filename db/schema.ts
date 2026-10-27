import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Kept independently of request retention so public numbers are never reused.
export const requestReferences = sqliteTable(
  'request_references',
  {
    number: integer('number').primaryKey({ autoIncrement: true }),
    kind: text('kind').notNull(),
    requestId: text('request_id').notNull(),
  },
  (table) => [uniqueIndex('request_references_kind_id').on(table.kind, table.requestId)],
);

export const reservations = sqliteTable(
  'reservations',
  {
    id: text('id').primaryKey(),
    payloadHash: text('payload_hash').notNull(),
    createdAt: integer('created_at').notNull(),
    abuseKey: text('abuse_key').notNull(),
    phoneHash: text('phone_hash').notNull(),
    reservationJson: text('reservation_json').notNull(),
    notificationJson: text('notification_json').notNull().default('[]'),
  },
  (table) => [
    index('reservations_abuse_time').on(table.abuseKey, table.createdAt),
    index('reservations_phone_time').on(table.phoneHash, table.createdAt),
  ],
);

export const orders = sqliteTable(
  'orders',
  {
    id: text('id').primaryKey(),
    payloadHash: text('payload_hash').notNull(),
    createdAt: integer('created_at').notNull(),
    abuseKey: text('abuse_key').notNull(),
    phoneHash: text('phone_hash').notNull(),
    orderJson: text('order_json').notNull(),
    notificationJson: text('notification_json').notNull().default('[]'),
  },
  (table) => [
    index('orders_abuse_time').on(table.abuseKey, table.createdAt),
    index('orders_phone_time').on(table.phoneHash, table.createdAt),
  ],
);
