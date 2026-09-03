CREATE TABLE `workout_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_id` text NOT NULL,
	`workout_date` text NOT NULL,
	`session` text NOT NULL,
	`exercise_id` text NOT NULL,
	`weight` real,
	`reps` integer,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_workout_logs_owner_date_session_exercise` ON `workout_logs` (`owner_id`,`workout_date`,`session`,`exercise_id`);--> statement-breakpoint
CREATE INDEX `idx_workout_logs_owner_date` ON `workout_logs` (`owner_id`,`workout_date`);