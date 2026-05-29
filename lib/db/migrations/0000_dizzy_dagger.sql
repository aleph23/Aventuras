CREATE TABLE `app_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`providers` text DEFAULT '[]' NOT NULL,
	`profiles` text DEFAULT '[]' NOT NULL,
	`assignments` text DEFAULT '{}' NOT NULL,
	`default_provider_id` text,
	`diagnostics` text DEFAULT '{"enabled":false,"debug_level_enabled":false}' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `branches` (
	`id` text PRIMARY KEY NOT NULL,
	`story_id` text NOT NULL,
	`parent_branch_id` text,
	`fork_entry_id` text,
	`name` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`story_id`) REFERENCES `stories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`parent_branch_id`) REFERENCES `branches`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `pipeline_runs` (
	`run_id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`action_id` text NOT NULL,
	`story_id` text,
	`started_at` integer NOT NULL,
	`finished_at` integer,
	`outcome` text
);
--> statement-breakpoint
CREATE TABLE `stories` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`tags` text DEFAULT '[]' NOT NULL,
	`cover_asset_id` text,
	`accent_color` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`favorite` integer DEFAULT 0 NOT NULL,
	`last_opened_at` integer,
	`definition` text,
	`settings` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`current_branch_id` text
);
--> statement-breakpoint
CREATE TABLE `story_entries` (
	`id` text NOT NULL,
	`branch_id` text NOT NULL,
	`position` integer NOT NULL,
	`kind` text NOT NULL,
	`content` text NOT NULL,
	`chapter_id` text,
	`metadata` text,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`branch_id`, `id`),
	FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON UPDATE no action ON DELETE no action
);
