CREATE TABLE `countryStats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`countryCode` varchar(2) NOT NULL,
	`countryName` varchar(100) NOT NULL,
	`totalClicks` bigint NOT NULL DEFAULT 0,
	`userCount` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `countryStats_id` PRIMARY KEY(`id`),
	CONSTRAINT `countryStats_countryCode_unique` UNIQUE(`countryCode`)
);
--> statement-breakpoint
CREATE TABLE `globalCounter` (
	`id` int NOT NULL DEFAULT 1,
	`totalClicks` bigint NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `globalCounter_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`lastClickAt` timestamp,
	`clickCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	CONSTRAINT `userSessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `userSessions_sessionId_unique` UNIQUE(`sessionId`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `country` varchar(2);--> statement-breakpoint
ALTER TABLE `users` ADD `totalClicks` bigint DEFAULT 0 NOT NULL;