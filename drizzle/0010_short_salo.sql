CREATE TABLE `crm_campaign` (
	`id` int AUTO_INCREMENT NOT NULL,
	`restaurantId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`messageText` text NOT NULL,
	`imageUrl` text,
	`targetSegment` enum('ALL','NEW','RECURRING','INACTIVE','VIP') NOT NULL DEFAULT 'ALL',
	`createdByUserId` int NOT NULL,
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `crm_campaign_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crm_campaign_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`customerId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crm_campaign_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crm_customer_snapshot` (
	`id` int AUTO_INCREMENT NOT NULL,
	`restaurantId` int NOT NULL,
	`customerId` int NOT NULL,
	`firstOrderAt` timestamp,
	`lastOrderAt` timestamp,
	`ordersCount` int NOT NULL DEFAULT 0,
	`totalSpentCents` int NOT NULL DEFAULT 0,
	`avgTicketCents` int NOT NULL DEFAULT 0,
	`status` enum('NEW','RECURRING','INACTIVE','VIP','PROMO') NOT NULL DEFAULT 'NEW',
	`frequencyDaysAvg` decimal(10,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `crm_customer_snapshot_id` PRIMARY KEY(`id`)
);
