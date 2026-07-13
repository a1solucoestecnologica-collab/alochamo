CREATE TABLE `menuItemVariations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`itemId` int NOT NULL,
	`size` varchar(50) NOT NULL,
	`price` int NOT NULL,
	`isAvailable` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `menuItemVariations_id` PRIMARY KEY(`id`)
);
