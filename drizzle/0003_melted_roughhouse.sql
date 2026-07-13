CREATE TABLE `networkPromotions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`subtitle` varchar(255),
	`imageUrl` text NOT NULL,
	`linkUrl` text,
	`restaurantId` int,
	`order` int DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`validFrom` timestamp,
	`validUntil` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `networkPromotions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `restaurants` ADD `isFeatured` boolean DEFAULT false NOT NULL;