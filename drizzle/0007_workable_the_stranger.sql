CREATE TABLE `itemAvailability` (
	`id` int AUTO_INCREMENT NOT NULL,
	`itemId` int NOT NULL,
	`period` enum('breakfast','lunch','dinner','all_day') NOT NULL,
	`startTime` varchar(5),
	`endTime` varchar(5),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `itemAvailability_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `restaurantHours` (
	`id` int AUTO_INCREMENT NOT NULL,
	`restaurantId` int NOT NULL,
	`dayOfWeek` int NOT NULL,
	`openTime` varchar(5),
	`closeTime` varchar(5),
	`isClosed` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `restaurantHours_id` PRIMARY KEY(`id`)
);
