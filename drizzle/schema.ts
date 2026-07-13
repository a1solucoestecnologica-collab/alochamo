import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal, date } from "drizzle-orm/mysql-core";

/**
 * USUÁRIOS
 * Tabela principal de usuários com três tipos: cliente, restaurante, admin
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  password: varchar("password", { length: 255 }), // Para restaurante e admin
  cpf: varchar("cpf", { length: 14 }).unique(), // Para cliente
  phone: varchar("phone", { length: 20 }),
  birthDate: timestamp("birthDate"),
  userType: mysqlEnum("userType", ["cliente", "restaurante", "admin"]).notNull(),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  loginMethod: varchar("loginMethod", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/**
 * ENDEREÇOS
 */
export const addresses = mysqlTable("addresses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  street: text("street").notNull(),
  number: varchar("number", { length: 20 }).notNull(),
  complement: text("complement"),
  neighborhood: varchar("neighborhood", { length: 255 }).notNull(),
  city: varchar("city", { length: 255 }).notNull(),
  state: varchar("state", { length: 2 }).notNull(),
  zipCode: varchar("zipCode", { length: 10 }).notNull(),
  isDefault: boolean("isDefault").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * RESTAURANTES
 */
export const restaurants = mysqlTable("restaurants", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(), // Referência ao usuário do tipo restaurante
  name: text("name").notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  cpfCnpj: varchar("cpfCnpj", { length: 20 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  logoUrl: text("logoUrl"),
  coverUrl: text("coverUrl"),
  primaryColor: varchar("primaryColor", { length: 7 }).default("#7c3aed"), // Cor primária em hex
  bio: text("bio"), // Descrição estendida/bio do restaurante
  
  // Endereço
  street: text("street").notNull(),
  number: varchar("number", { length: 20 }).notNull(),
  complement: text("complement"),
  neighborhood: varchar("neighborhood", { length: 255 }).notNull(),
  city: varchar("city", { length: 255 }).notNull(),
  state: varchar("state", { length: 2 }).notNull(),
  zipCode: varchar("zipCode", { length: 10 }).notNull(),
  
  // Operação
  categoryId: int("categoryId"),
  openingHours: text("openingHours"), // JSON string
  deliveryFee: int("deliveryFee").notNull().default(0), // Em centavos
  averagePrepTime: int("averagePrepTime").notNull().default(30), // Em minutos
  minimumOrder: int("minimumOrder").default(0), // Em centavos
  
  // Status e aprovação
  status: mysqlEnum("status", ["pending", "approved", "rejected", "suspended"]).default("pending").notNull(),
  approvedAt: timestamp("approvedAt"),
  approvedBy: int("approvedBy"),
  rejectionReason: text("rejectionReason"),
  
  // Avaliação
  rating: int("rating").default(0), // Média * 100 (ex: 4.5 = 450)
  totalReviews: int("totalReviews").default(0),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * CATEGORIAS DE RESTAURANTES
 */
export const restaurantCategories = mysqlTable("restaurantCategories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  icon: varchar("icon", { length: 255 }),
  order: int("order").default(0),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * CATEGORIAS DO CARDÁPIO
 */
export const menuCategories = mysqlTable("menuCategories", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurantId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  order: int("order").default(0),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * ITENS DO CARDÁPIO
 */
export const menuItems = mysqlTable("menuItems", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurantId").notNull(),
  categoryId: int("categoryId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: int("price").notNull(), // Em centavos
  imageUrl: text("imageUrl"),
  isAvailable: boolean("isAvailable").default(true).notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(), // Mais pedidos
  preparationTime: int("preparationTime"), // Em minutos
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * VARIAÇÕES DE TAMANHO DOS ITENS
 * Permite criar múltiplas versões do mesmo prato (P/M/G) com preços diferentes
 */
export const menuItemVariations = mysqlTable("menuItemVariations", {
  id: int("id").autoincrement().primaryKey(),
  itemId: int("itemId").notNull(), // Referência ao item principal
  size: varchar("size", { length: 50 }).notNull(), // P, M, G, ou personalizado
  price: int("price").notNull(), // Em centavos
  isAvailable: boolean("isAvailable").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * ADICIONAIS
 */
export const additionals = mysqlTable("additionals", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurantId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  price: int("price").notNull(), // Em centavos
  isAvailable: boolean("isAvailable").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * ADICIONAIS POR ITEM
 */
export const itemAdditionals = mysqlTable("itemAdditionals", {
  id: int("id").autoincrement().primaryKey(),
  itemId: int("itemId").notNull(),
  additionalId: int("additionalId").notNull(),
  isRequired: boolean("isRequired").default(false).notNull(),
  maxQuantity: int("maxQuantity").default(1),
});

/**
 * COMBOS
 */
export const combos = mysqlTable("combos", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurantId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: int("price").notNull(), // Em centavos
  imageUrl: text("imageUrl"),
  isAvailable: boolean("isAvailable").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * ITENS DO COMBO
 */
export const comboItems = mysqlTable("comboItems", {
  id: int("id").autoincrement().primaryKey(),
  comboId: int("comboId").notNull(),
  itemId: int("itemId").notNull(),
  quantity: int("quantity").notNull().default(1),
});

/**
 * PEDIDOS
 */
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 20 }).notNull().unique(),
  customerId: int("customerId").notNull(),
  restaurantId: int("restaurantId").notNull(),
  
  // Endereço de entrega
  deliveryStreet: text("deliveryStreet").notNull(),
  deliveryNumber: varchar("deliveryNumber", { length: 20 }).notNull(),
  deliveryComplement: text("deliveryComplement"),
  deliveryNeighborhood: varchar("deliveryNeighborhood", { length: 255 }).notNull(),
  deliveryCity: varchar("deliveryCity", { length: 255 }).notNull(),
  deliveryState: varchar("deliveryState", { length: 2 }).notNull(),
  deliveryZipCode: varchar("deliveryZipCode", { length: 10 }).notNull(),
  
  // Valores
  subtotal: int("subtotal").notNull(), // Em centavos
  deliveryFee: int("deliveryFee").notNull(), // Em centavos
  serviceFee: int("serviceFee").notNull().default(99), // R$ 0,99 em centavos
  discount: int("discount").default(0), // Em centavos
  total: int("total").notNull(), // Em centavos
  
  // Cupom/Voucher
  couponCode: varchar("couponCode", { length: 50 }),
  voucherCode: varchar("voucherCode", { length: 50 }),
  
  // Status
  status: mysqlEnum("status", ["received", "preparing", "ready", "delivering", "delivered", "cancelled"]).default("received").notNull(),
  
  // Observações
  notes: text("notes"),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  deliveredAt: timestamp("deliveredAt"),
});

/**
 * ITENS DO PEDIDO
 */
export const orderItems = mysqlTable("orderItems", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  itemId: int("itemId"),
  comboId: int("comboId"),
  name: varchar("name", { length: 255 }).notNull(),
  quantity: int("quantity").notNull(),
  unitPrice: int("unitPrice").notNull(), // Em centavos
  subtotal: int("subtotal").notNull(), // Em centavos
  notes: text("notes"),
});

/**
 * ADICIONAIS DO PEDIDO
 */
export const orderItemAdditionals = mysqlTable("orderItemAdditionals", {
  id: int("id").autoincrement().primaryKey(),
  orderItemId: int("orderItemId").notNull(),
  additionalId: int("additionalId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  quantity: int("quantity").notNull(),
  unitPrice: int("unitPrice").notNull(), // Em centavos
  subtotal: int("subtotal").notNull(), // Em centavos
});

/**
 * CUPONS
 */
export const coupons = mysqlTable("coupons", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  restaurantId: int("restaurantId"), // NULL = cupom global (admin)
  type: mysqlEnum("type", ["percentage", "fixed"]).notNull(),
  value: int("value").notNull(), // Porcentagem * 100 ou valor em centavos
  minimumOrder: int("minimumOrder").default(0), // Em centavos
  maxDiscount: int("maxDiscount"), // Em centavos (para cupons de porcentagem)
  usageLimit: int("usageLimit"), // NULL = ilimitado
  usedCount: int("usedCount").default(0),
  validFrom: timestamp("validFrom").notNull(),
  validUntil: timestamp("validUntil").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * VOUCHERS DE PRODUTO
 */
export const vouchers = mysqlTable("vouchers", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  itemId: int("itemId").notNull(), // Item vinculado
  restaurantId: int("restaurantId").notNull(),
  usageLimit: int("usageLimit"), // NULL = ilimitado
  usedCount: int("usedCount").default(0),
  validFrom: timestamp("validFrom").notNull(),
  validUntil: timestamp("validUntil").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdBy: int("createdBy").notNull(), // Admin que criou
});

/**
 * USO DE VOUCHERS
 */
export const voucherUsage = mysqlTable("voucherUsage", {
  id: int("id").autoincrement().primaryKey(),
  voucherId: int("voucherId").notNull(),
  orderId: int("orderId").notNull(),
  userId: int("userId").notNull(),
  usedAt: timestamp("usedAt").defaultNow().notNull(),
});

/**
 * AVALIAÇÕES
 */
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull().unique(),
  restaurantId: int("restaurantId").notNull(),
  customerId: int("customerId").notNull(),
  
  // Notas (0-5, multiplicado por 100)
  foodRating: int("foodRating").notNull(),
  packagingRating: int("packagingRating").notNull(),
  timeRating: int("timeRating").notNull(),
  overallRating: int("overallRating").notNull(),
  
  comment: text("comment"),
  restaurantResponse: text("restaurantResponse"),
  respondedAt: timestamp("respondedAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * FAVORITOS
 */
export const favorites = mysqlTable("favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  restaurantId: int("restaurantId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * HORÁRIOS DE FUNCIONAMENTO
 */
export const restaurantHours = mysqlTable("restaurantHours", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurantId").notNull(),
  dayOfWeek: int("dayOfWeek").notNull(), // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  openTime: varchar("openTime", { length: 5 }), // Formato HH:MM (ex: "08:00")
  closeTime: varchar("closeTime", { length: 5 }), // Formato HH:MM (ex: "22:00")
  isClosed: boolean("isClosed").default(false).notNull(), // Se o restaurante está fechado neste dia
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * DISPONIBILIDADE DE ITENS POR PERÍODO
 */
export const itemAvailability = mysqlTable("itemAvailability", {
  id: int("id").autoincrement().primaryKey(),
  itemId: int("itemId").notNull(),
  period: mysqlEnum("period", ["breakfast", "lunch", "dinner", "all_day"]).notNull(),
  startTime: varchar("startTime", { length: 5 }), // Formato HH:MM
  endTime: varchar("endTime", { length: 5 }), // Formato HH:MM
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * BANNERS
 */
export const banners = mysqlTable("banners", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  imageUrl: text("imageUrl").notNull(),
  linkUrl: text("linkUrl"),
  order: int("order").default(0),
  isActive: boolean("isActive").default(true).notNull(),
  validFrom: timestamp("validFrom"),
  validUntil: timestamp("validUntil"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * VOUCHERS EM DESTAQUE
 * Vouchers promocionais gerenciados apenas pelo admin
 */
export const featuredVouchers = mysqlTable("featured_vouchers", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  imageUrl: text("imageUrl").notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  discountType: mysqlEnum("discountType", ["percentage", "fixed", "free_item"]).notNull(),
  discountValue: int("discountValue"), // Percentual ou valor fixo em centavos
  menuItemId: int("menuItemId"), // Para voucher de item específico (free_item)
  minOrderValue: int("minOrderValue"), // Valor mínimo do pedido em centavos
  maxDiscount: int("maxDiscount"), // Desconto máximo em centavos
  usageLimit: int("usageLimit"), // Limite de uso total
  usageCount: int("usageCount").default(0).notNull(),
  order: int("order").default(0),
  isActive: boolean("isActive").default(true).notNull(),
  validFrom: timestamp("validFrom"),
  validUntil: timestamp("validUntil"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * VOUCHERS DO RESTAURANTE (Sistema Chamô)
 * Vouchers diários criados pelos restaurantes
 */
export const restaurantVouchers = mysqlTable("restaurant_vouchers", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurantId").notNull(),
  date: date("date").notNull(), // Data específica do voucher (YYYY-MM-DD)
  type: mysqlEnum("type", ["DESCONTO_VALOR", "BRINDE", "BENEFICIO"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  imageUrl: text("imageUrl").notNull(),
  discountValue: int("discountValue"), // Valor do desconto em centavos (para DESCONTO_VALOR)
  minimumOrder: int("minimumOrder"), // Pedido mínimo em centavos
  quantity: int("quantity").notNull(), // Quantidade disponível
  usedCount: int("usedCount").default(0).notNull(), // Quantidade já usada
  status: mysqlEnum("status", ["AGENDADO", "ATIVO", "EXPIRADO"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * MÉTRICAS DE VOUCHERS
 * Registra visualizações e cliques nos vouchers
 */
export const voucherMetrics = mysqlTable("voucher_metrics", {
  id: int("id").autoincrement().primaryKey(),
  voucherId: int("voucherId").notNull(),
  eventType: mysqlEnum("eventType", ["VIEW", "CLICK", "WHATSAPP_CLICK"]).notNull(),
  userId: int("userId"), // NULL se usuário não logado
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * CRM - SNAPSHOT DE CLIENTES
 * Tabela de estatísticas agregadas por cliente/restaurante para performance
 */
export const crmCustomerSnapshot = mysqlTable("crm_customer_snapshot", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurantId").notNull(),
  customerId: int("customerId").notNull(), // FK → users.id (cliente)
  firstOrderAt: timestamp("firstOrderAt"),
  lastOrderAt: timestamp("lastOrderAt"),
  ordersCount: int("ordersCount").default(0).notNull(),
  totalSpentCents: int("totalSpentCents").default(0).notNull(), // Total gasto em centavos
  avgTicketCents: int("avgTicketCents").default(0).notNull(), // Ticket médio em centavos
  status: mysqlEnum("status", ["NEW", "RECURRING", "INACTIVE", "VIP", "PROMO"]).default("NEW").notNull(),
  frequencyDaysAvg: decimal("frequencyDaysAvg", { precision: 10, scale: 2 }), // Média de dias entre pedidos
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * CRM - CAMPANHAS
 * Campanhas de marketing criadas pelos restaurantes
 */
export const crmCampaign = mysqlTable("crm_campaign", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurantId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  messageText: text("messageText").notNull(),
  imageUrl: text("imageUrl"),
  targetSegment: mysqlEnum("targetSegment", ["ALL", "NEW", "RECURRING", "INACTIVE", "VIP"]).default("ALL").notNull(),
  createdByUserId: int("createdByUserId").notNull(), // FK → users.id (usuário do painel)
  sentAt: timestamp("sentAt"), // NULL = não enviada ainda
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * CRM - LOG DE CAMPANHAS
 * Registra quais clientes receberam cada campanha
 */
export const crmCampaignLog = mysqlTable("crm_campaign_log", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(), // FK → crm_campaign.id
  customerId: int("customerId").notNull(), // FK → users.id (cliente)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type InsertMenuItemVariation = typeof menuItemVariations.$inferInsert;
export type Restaurant = typeof restaurants.$inferSelect;
export type MenuItem = typeof menuItems.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type FeaturedVoucher = typeof featuredVouchers.$inferSelect;
export type CrmCustomerSnapshot = typeof crmCustomerSnapshot.$inferSelect;
export type InsertCrmCustomerSnapshot = typeof crmCustomerSnapshot.$inferInsert;
export type CrmCampaign = typeof crmCampaign.$inferSelect;
export type InsertCrmCampaign = typeof crmCampaign.$inferInsert;
export type CrmCampaignLog = typeof crmCampaignLog.$inferSelect;
export type InsertCrmCampaignLog = typeof crmCampaignLog.$inferInsert;