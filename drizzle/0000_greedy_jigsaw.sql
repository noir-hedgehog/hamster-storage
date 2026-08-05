CREATE TABLE `import_batches` (
	`id` text PRIMARY KEY NOT NULL,
	`input` text NOT NULL,
	`imported_count` integer DEFAULT 0 NOT NULL,
	`skipped_count` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `items` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`brand` text DEFAULT '' NOT NULL,
	`category` text DEFAULT '' NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`unit` text DEFAULT '件' NOT NULL,
	`location` text DEFAULT '待整理' NOT NULL,
	`price_cents` integer DEFAULT 0 NOT NULL,
	`purchase_date` text,
	`expiry_date` text,
	`tags` text DEFAULT '[]' NOT NULL,
	`import_key` text NOT NULL,
	`source` text DEFAULT 'manual' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `items_import_key_unique` ON `items` (`import_key`);