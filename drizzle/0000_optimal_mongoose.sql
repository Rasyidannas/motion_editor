CREATE TABLE `animejs` (
	`id` text PRIMARY KEY NOT NULL,
	`element_id` text,
	`type` text NOT NULL,
	`type_value` text,
	`util` text,
	`util_value` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`element_id`) REFERENCES `elements`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `elements` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`value` text NOT NULL,
	`type` text NOT NULL,
	`frame_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`frame_id`) REFERENCES `frames`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `frames` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
