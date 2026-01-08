PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_practice_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`routine_id` text NOT NULL,
	`user_id` text,
	`started_at` integer NOT NULL,
	`completed_at` integer,
	`duration` integer,
	`notes` text,
	FOREIGN KEY (`routine_id`) REFERENCES `routines`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_practice_logs`("id", "routine_id", "user_id", "started_at", "completed_at", "duration", "notes") SELECT "id", "routine_id", "user_id", "started_at", "completed_at", "duration", "notes" FROM `practice_logs`;--> statement-breakpoint
DROP TABLE `practice_logs`;--> statement-breakpoint
ALTER TABLE `__new_practice_logs` RENAME TO `practice_logs`;--> statement-breakpoint
PRAGMA foreign_keys=ON;