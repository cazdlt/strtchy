-- Migration: Update practice_data from routine_movement_id-based to movement snapshot-based schema
-- This migration transforms the old practice_data table (which referenced routine_movements)
-- to a self-contained historical record with movement metadata snapshot.

ALTER TABLE `practice_data` RENAME TO `practice_data_old`;
--> statement-breakpoint
CREATE TABLE `practice_data` (
	`id` text PRIMARY KEY NOT NULL,
	`practice_log_id` text NOT NULL,
	`movement_id` text NOT NULL,
	`movement_name` text NOT NULL,
	`movement_type` text NOT NULL,
	`target_type` text NOT NULL,
	`target_value` integer NOT NULL,
	`order` integer NOT NULL,
	`set_number` integer NOT NULL,
	`side` text,
	`value` integer NOT NULL,
	`weight` integer,
	`weight_unit` text,
	`custom_measurement` text,
	`rating` integer,
	`status` text DEFAULT 'completed' NOT NULL,
	`completed_at` integer NOT NULL,
	FOREIGN KEY (`practice_log_id`) REFERENCES `practice_logs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `practice_data` (
	`id`, `practice_log_id`, `movement_id`, `movement_name`, `movement_type`,
	`target_type`, `target_value`, `order`, `set_number`, `side`, `value`,
	`weight`, `weight_unit`, `custom_measurement`, `rating`, `status`, `completed_at`
)
SELECT 
	`pd`.`id`,
	`pd`.`practice_log_id`,
	COALESCE(`rm`.`movement_id`, 'unknown'),
	COALESCE(`m`.`name`, 'Unknown Movement'),
	COALESCE(`m`.`type`, 'timed'),
	COALESCE(CASE 
		WHEN json_extract(`rm`.`target`, '$.type') IN ('time', 'reps') 
		THEN json_extract(`rm`.`target`, '$.type') 
		END, `pd`.`measurement_type`),
	COALESCE(json_extract(`rm`.`target`, '$.value'), `pd`.`value`),
	COALESCE(`rm`.`order`, 0),
	`pd`.`set_number`,
	`pd`.`side`,
	`pd`.`value`,
	`pd`.`weight`,
	`pd`.`weight_unit`,
	`pd`.`custom_measurement`,
	`pd`.`rating`,
	`pd`.`status`,
	`pd`.`completed_at`
FROM `practice_data_old` `pd`
LEFT JOIN `routine_movements` `rm` ON `pd`.`routine_movement_id` = `rm`.`id`
LEFT JOIN `movements` `m` ON `rm`.`movement_id` = `m`.`id`;
--> statement-breakpoint
DROP TABLE `practice_data_old`;
