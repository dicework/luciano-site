CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`payload_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	`abuse_key` text NOT NULL,
	`phone_hash` text NOT NULL,
	`order_json` text NOT NULL,
	`notification_json` text DEFAULT '[]' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `orders_abuse_time` ON `orders` (`abuse_key`,`created_at`);--> statement-breakpoint
CREATE INDEX `orders_phone_time` ON `orders` (`phone_hash`,`created_at`);