CREATE TABLE `additionals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`restaurantId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`price` int NOT NULL,
	`isAvailable` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `additionals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `addresses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`street` text NOT NULL,
	`number` varchar(20) NOT NULL,
	`complement` text,
	`neighborhood` varchar(255) NOT NULL,
	`city` varchar(255) NOT NULL,
	`state` varchar(2) NOT NULL,
	`zipCode` varchar(10) NOT NULL,
	`isDefault` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `addresses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `banners` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`imageUrl` text NOT NULL,
	`linkUrl` text,
	`order` int DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`validFrom` timestamp,
	`validUntil` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `banners_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `comboItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`comboId` int NOT NULL,
	`itemId` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	CONSTRAINT `comboItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `combos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`restaurantId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`price` int NOT NULL,
	`imageUrl` text,
	`isAvailable` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `combos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coupons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`restaurantId` int,
	`type` enum('percentage','fixed') NOT NULL,
	`value` int NOT NULL,
	`minimumOrder` int DEFAULT 0,
	`maxDiscount` int,
	`usageLimit` int,
	`usedCount` int DEFAULT 0,
	`validFrom` timestamp NOT NULL,
	`validUntil` timestamp NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coupons_id` PRIMARY KEY(`id`),
	CONSTRAINT `coupons_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`restaurantId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `favorites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `itemAdditionals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`itemId` int NOT NULL,
	`additionalId` int NOT NULL,
	`isRequired` boolean NOT NULL DEFAULT false,
	`maxQuantity` int DEFAULT 1,
	CONSTRAINT `itemAdditionals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `menuCategories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`restaurantId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`order` int DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `menuCategories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `menuItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`restaurantId` int NOT NULL,
	`categoryId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`price` int NOT NULL,
	`imageUrl` text,
	`isAvailable` boolean NOT NULL DEFAULT true,
	`isFeatured` boolean NOT NULL DEFAULT false,
	`preparationTime` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `menuItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orderItemAdditionals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderItemId` int NOT NULL,
	`additionalId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`quantity` int NOT NULL,
	`unitPrice` int NOT NULL,
	`subtotal` int NOT NULL,
	CONSTRAINT `orderItemAdditionals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orderItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`itemId` int,
	`comboId` int,
	`name` varchar(255) NOT NULL,
	`quantity` int NOT NULL,
	`unitPrice` int NOT NULL,
	`subtotal` int NOT NULL,
	`notes` text,
	CONSTRAINT `orderItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNumber` varchar(20) NOT NULL,
	`customerId` int NOT NULL,
	`restaurantId` int NOT NULL,
	`deliveryStreet` text NOT NULL,
	`deliveryNumber` varchar(20) NOT NULL,
	`deliveryComplement` text,
	`deliveryNeighborhood` varchar(255) NOT NULL,
	`deliveryCity` varchar(255) NOT NULL,
	`deliveryState` varchar(2) NOT NULL,
	`deliveryZipCode` varchar(10) NOT NULL,
	`subtotal` int NOT NULL,
	`deliveryFee` int NOT NULL,
	`serviceFee` int NOT NULL DEFAULT 99,
	`discount` int DEFAULT 0,
	`total` int NOT NULL,
	`couponCode` varchar(50),
	`voucherCode` varchar(50),
	`status` enum('received','preparing','ready','delivering','delivered','cancelled') NOT NULL DEFAULT 'received',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deliveredAt` timestamp,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderNumber_unique` UNIQUE(`orderNumber`)
);
--> statement-breakpoint
CREATE TABLE `restaurantCategories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`icon` varchar(255),
	`order` int DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `restaurantCategories_id` PRIMARY KEY(`id`),
	CONSTRAINT `restaurantCategories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `restaurants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` text NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`cpfCnpj` varchar(20) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`email` varchar(320) NOT NULL,
	`logoUrl` text,
	`coverUrl` text,
	`street` text NOT NULL,
	`number` varchar(20) NOT NULL,
	`complement` text,
	`neighborhood` varchar(255) NOT NULL,
	`city` varchar(255) NOT NULL,
	`state` varchar(2) NOT NULL,
	`zipCode` varchar(10) NOT NULL,
	`categoryId` int,
	`openingHours` text,
	`deliveryFee` int NOT NULL DEFAULT 0,
	`averagePrepTime` int NOT NULL DEFAULT 30,
	`minimumOrder` int DEFAULT 0,
	`status` enum('pending','approved','rejected','suspended') NOT NULL DEFAULT 'pending',
	`approvedAt` timestamp,
	`approvedBy` int,
	`rejectionReason` text,
	`rating` int DEFAULT 0,
	`totalReviews` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `restaurants_id` PRIMARY KEY(`id`),
	CONSTRAINT `restaurants_userId_unique` UNIQUE(`userId`),
	CONSTRAINT `restaurants_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`restaurantId` int NOT NULL,
	`customerId` int NOT NULL,
	`foodRating` int NOT NULL,
	`packagingRating` int NOT NULL,
	`timeRating` int NOT NULL,
	`overallRating` int NOT NULL,
	`comment` text,
	`restaurantResponse` text,
	`respondedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`),
	CONSTRAINT `reviews_orderId_unique` UNIQUE(`orderId`)
);
--> statement-breakpoint
CREATE TABLE `voucherUsage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`voucherId` int NOT NULL,
	`orderId` int NOT NULL,
	`userId` int NOT NULL,
	`usedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `voucherUsage_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vouchers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`itemId` int NOT NULL,
	`restaurantId` int NOT NULL,
	`usageLimit` int,
	`usedCount` int DEFAULT 0,
	`validFrom` timestamp NOT NULL,
	`validUntil` timestamp NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`createdBy` int NOT NULL,
	CONSTRAINT `vouchers_id` PRIMARY KEY(`id`),
	CONSTRAINT `vouchers_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `openId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `name` text NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `password` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `cpf` varchar(14);--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `birthDate` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `userType` enum('cliente','restaurante','admin') NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_cpf_unique` UNIQUE(`cpf`);