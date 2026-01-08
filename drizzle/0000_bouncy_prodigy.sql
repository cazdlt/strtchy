CREATE TABLE `movements` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`type` text NOT NULL,
	`svg_illustration` text,
	`is_custom` integer DEFAULT false NOT NULL,
	`user_id` text,
	`metadata` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `practice_data` (
	`id` text PRIMARY KEY NOT NULL,
	`practice_log_id` text NOT NULL,
	`routine_movement_id` text NOT NULL,
	`set_number` integer NOT NULL,
	`value` integer NOT NULL,
	`measurement_type` text NOT NULL,
	`custom_measurement` text,
	`completed_at` integer NOT NULL,
	FOREIGN KEY (`practice_log_id`) REFERENCES `practice_logs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`routine_movement_id`) REFERENCES `routine_movements`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `practice_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`routine_id` text NOT NULL,
	`user_id` text NOT NULL,
	`started_at` integer NOT NULL,
	`completed_at` integer,
	`duration` integer,
	`notes` text,
	FOREIGN KEY (`routine_id`) REFERENCES `routines`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `routine_movements` (
	`id` text PRIMARY KEY NOT NULL,
	`routine_id` text NOT NULL,
	`movement_id` text NOT NULL,
	`order` integer NOT NULL,
	`target` text NOT NULL,
	`sets` integer DEFAULT 1 NOT NULL,
	`notes` text,
	FOREIGN KEY (`routine_id`) REFERENCES `routines`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`movement_id`) REFERENCES `movements`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `routines` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`user_id` text,
	`rest_between_movements` integer DEFAULT 30 NOT NULL,
	`rest_between_sets` integer DEFAULT 15 NOT NULL,
	`auto_advance` integer DEFAULT true NOT NULL,
	`audio_enabled` integer DEFAULT true NOT NULL,
	`keep_awake` integer DEFAULT true NOT NULL,
	`is_custom` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	`preferences` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);