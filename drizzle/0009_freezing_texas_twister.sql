CREATE TABLE `restaurant_vouchers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`restaurantId` int NOT NULL,
	`date` date NOT NULL,
	`type` enum('DESCONTO_VALOR','BRINDE','BENEFICIO') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`imageUrl` text NOT NULL,
	`discountValue` int,
	`minimumOrder` int,
	`quantity` int NOT NULL,
	`usedCount` int NOT NULL DEFAULT 0,
	`status` enum('AGENDADO','ATIVO','EXPIRADO') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `restaurant_vouchers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `voucher_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`voucherId` int NOT NULL,
	`eventType` enum('VIEW','CLICK','WHATSAPP_CLICK') NOT NULL,
	`userId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `voucher_metrics_id` PRIMARY KEY(`id`)
);
