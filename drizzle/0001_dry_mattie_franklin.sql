CREATE TABLE `reservations` (
	`id` text PRIMARY KEY NOT NULL,
	`payload_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	`abuse_key` text NOT NULL,
	`phone_hash` text NOT NULL,
	`reservation_json` text NOT NULL,
	`notification_json` text DEFAULT '[]' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `reservations_abuse_time` ON `reservations` (`abuse_key`,`created_at`);--> statement-breakpoint
CREATE INDEX `reservations_phone_time` ON `reservations` (`phone_hash`,`created_at`);