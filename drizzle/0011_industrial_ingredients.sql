CREATE TABLE IF NOT EXISTS `ingredients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`restaurantId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`supplier` varchar(255),
	`unit` varchar(32) NOT NULL DEFAULT 'g',
	`packageQuantity` int NOT NULL DEFAULT 1000,
	`packageCost` int NOT NULL DEFAULT 0,
	`yieldPercent` int NOT NULL DEFAULT 100,
	`wastePercent` int NOT NULL DEFAULT 0,
	`minStockQuantity` int NOT NULL DEFAULT 0,
	`currentStockQuantity` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ingredients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `menuItemIngredients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`itemId` int NOT NULL,
	`ingredientId` int NOT NULL,
	`quantity` int NOT NULL,
	`unit` varchar(32) NOT NULL DEFAULT 'g',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `menuItemIngredients_id` PRIMARY KEY(`id`)
);
