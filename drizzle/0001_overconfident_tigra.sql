CREATE TABLE `tree_elements` (
	`id` text PRIMARY KEY NOT NULL,
	`ancestor` text,
	`descendant` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`ancestor`) REFERENCES `elements`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`descendant`) REFERENCES `elements`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `elements` ADD `order` integer DEFAULT 0 NOT NULL;