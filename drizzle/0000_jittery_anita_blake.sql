CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`account_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`expires_at` integer,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `movements` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`type` text NOT NULL,
	`illustration_path` text,
	`is_custom` integer DEFAULT false NOT NULL,
	`user_id` text,
	`metadata` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `practice_data` (
	`id` text PRIMARY KEY NOT NULL,
	`practice_log_id` text NOT NULL,
	`routine_movement_id` text NOT NULL,
	`set_number` integer NOT NULL,
	`side` text,
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
	`user_id` text,
	`started_at` integer NOT NULL,
	`completed_at` integer,
	`duration` integer,
	`notes` text,
	FOREIGN KEY (`routine_id`) REFERENCES `routines`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `routine_movements` (
	`id` text PRIMARY KEY NOT NULL,
	`routine_id` text NOT NULL,
	`movement_id` text NOT NULL,
	`order` integer NOT NULL,
	`target` text NOT NULL,
	`sets` integer DEFAULT 1 NOT NULL,
	`is_bilateral` integer DEFAULT false NOT NULL,
	`switch_sides_duration` integer DEFAULT 5 NOT NULL,
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
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`name` text,
	`username` text,
	`image` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`password_hash` text,
	`preferences` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`code` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
