CREATE TABLE `request_references` (
	`number` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kind` text NOT NULL,
	`request_id` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `request_references_kind_id` ON `request_references` (`kind`,`request_id`);
--> statement-breakpoint
-- Preserve every existing request and give older receipts a stable public number.
INSERT INTO request_references (kind, request_id)
SELECT kind, request_id FROM (
  SELECT 'order' AS kind, id AS request_id, created_at FROM orders
  UNION ALL
  SELECT 'reservation' AS kind, id AS request_id, created_at FROM reservations
) ORDER BY created_at, kind, request_id;
--> statement-breakpoint
-- Allocate atomically with the request insert, including during rolling deployments.
CREATE TRIGGER orders_assign_reference AFTER INSERT ON orders
BEGIN
  INSERT INTO request_references (kind, request_id) VALUES ('order', NEW.id)
  ON CONFLICT(kind, request_id) DO NOTHING;
END;
--> statement-breakpoint
CREATE TRIGGER reservations_assign_reference AFTER INSERT ON reservations
BEGIN
  INSERT INTO request_references (kind, request_id) VALUES ('reservation', NEW.id)
  ON CONFLICT(kind, request_id) DO NOTHING;
END;
