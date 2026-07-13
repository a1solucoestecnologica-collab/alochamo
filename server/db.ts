import { eq, and, desc, like, inArray, sql, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, restaurants, menuCategories, menuItems, menuItemVariations,
  additionals, itemAdditionals, combos, comboItems, orders, orderItems,
  orderItemAdditionals, coupons, vouchers, voucherUsage, reviews,
  favorites, addresses, banners, restaurantCategories, featuredVouchers,
  restaurantHours, itemAvailability, crmCustomerSnapshot, crmCampaign, crmCampaignLog,
  InsertCrmCustomerSnapshot, InsertCrmCampaign, InsertCrmCampaignLog
} from "../drizzle/schema";
import { ENV } from './_core/env';
import { nanoid } from 'nanoid';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================
// USUÁRIOS
// ============================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
      name: user.name || "Usuário",
      userType: user.userType || "cliente",
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "cpf", "phone", "password"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.birthDate !== undefined) {
      values.birthDate = user.birthDate;
      updateSet.birthDate = user.birthDate;
    }
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }
    if (user.userType !== undefined) {
      values.userType = user.userType;
      updateSet.userType = user.userType;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByCpf(cpf: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.cpf, cpf)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  console.log('[getUserByEmail] Result:', JSON.stringify(result[0], null, 2));
  return result.length > 0 ? result[0] : undefined;
}

export async function createUser(data: InsertUser) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(users).values(data);
  return result;
}

export async function updateUser(id: number, data: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(users).set(data).where(eq(users.id, id));
}

// ============================================
// ENDEREÇOS
// ============================================

export async function getAddressesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(addresses).where(eq(addresses.userId, userId)).orderBy(desc(addresses.isDefault));
}

export async function createAddress(data: typeof addresses.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(addresses).values(data);
}

export async function updateAddress(id: number, data: Partial<typeof addresses.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(addresses).set(data).where(eq(addresses.id, id));
}

export async function deleteAddress(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(addresses).where(eq(addresses.id, id));
}

// ============================================
// RESTAURANTES
// ============================================

export async function getRestaurantById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(restaurants).where(eq(restaurants.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getRestaurantBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(restaurants).where(eq(restaurants.slug, slug)).limit(1);
  if (result.length === 0) return undefined;
  
  const restaurant = result[0];
  
  // Buscar horários de funcionamento
  const hours = await db.select().from(restaurantHours).where(eq(restaurantHours.restaurantId, restaurant.id));
  
  return {
    ...restaurant,
    operatingHours: hours.map(h => ({
      dayOfWeek: h.dayOfWeek,
      openTime: h.openTime,
      closeTime: h.closeTime,
      isClosed: h.isClosed,
    })),
  };
}

export async function getRestaurantByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(restaurants).where(eq(restaurants.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getApprovedRestaurants(filters?: { categoryId?: number; search?: string }) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(restaurants.status, "approved")];
  
  if (filters?.categoryId) {
    conditions.push(eq(restaurants.categoryId, filters.categoryId));
  }
  
  if (filters?.search) {
    conditions.push(like(restaurants.name, `%${filters.search}%`));
  }
  
  const restaurantsList = await db.select().from(restaurants).where(and(...conditions)).orderBy(desc(restaurants.rating));
  
  // Buscar horários de funcionamento para cada restaurante
  const restaurantsWithHours = await Promise.all(
    restaurantsList.map(async (restaurant) => {
      const hours = await db.select().from(restaurantHours).where(eq(restaurantHours.restaurantId, restaurant.id));
      return {
        ...restaurant,
        operatingHours: hours.map(h => ({
          dayOfWeek: h.dayOfWeek,
          openTime: h.openTime,
          closeTime: h.closeTime,
          isClosed: h.isClosed,
        })),
      };
    })
  );
  
  return restaurantsWithHours;
}

export async function getPendingRestaurants() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(restaurants).where(eq(restaurants.status, "pending")).orderBy(desc(restaurants.createdAt));
}

export async function createRestaurant(data: typeof restaurants.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(restaurants).values(data);
}

export async function updateRestaurant(id: number, data: Partial<typeof restaurants.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(restaurants).set(data).where(eq(restaurants.id, id));
}

// ============================================
// CATEGORIAS DE RESTAURANTES
// ============================================

export async function getRestaurantCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(restaurantCategories).where(eq(restaurantCategories.isActive, true)).orderBy(restaurantCategories.order);
}

export async function createRestaurantCategory(data: typeof restaurantCategories.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(restaurantCategories).values(data);
}

// ============================================
// CARDÁPIO
// ============================================

export async function getMenuCategoriesByRestaurant(restaurantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(menuCategories)
    .where(and(eq(menuCategories.restaurantId, restaurantId), eq(menuCategories.isActive, true)))
    .orderBy(menuCategories.order);
}

export async function getMenuItemsByRestaurant(restaurantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(menuItems).where(eq(menuItems.restaurantId, restaurantId)).orderBy(menuItems.name);
}

export async function getMenuItemById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(menuItems).where(eq(menuItems.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getMenuCategoryById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(menuCategories).where(eq(menuCategories.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function searchMenuItems(search: string, filters?: { restaurantId?: number; categoryId?: number }) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [
    like(menuItems.name, `%${search}%`),
    eq(menuItems.isAvailable, true)
  ];
  
  if (filters?.restaurantId) {
    conditions.push(eq(menuItems.restaurantId, filters.restaurantId));
  }
  
  if (filters?.categoryId) {
    conditions.push(eq(menuItems.categoryId, filters.categoryId));
  }
  
  // JOIN com restaurantes para incluir slug
  const results = await db
    .select({
      id: menuItems.id,
      name: menuItems.name,
      description: menuItems.description,
      price: menuItems.price,
      imageUrl: menuItems.imageUrl,
      isAvailable: menuItems.isAvailable,
      restaurantId: menuItems.restaurantId,
      categoryId: menuItems.categoryId,
      restaurant: {
        id: restaurants.id,
        name: restaurants.name,
        slug: restaurants.slug,
      }
    })
    .from(menuItems)
    .leftJoin(restaurants, eq(menuItems.restaurantId, restaurants.id))
    .where(and(...conditions));
  
  return results;
}

export async function createMenuItem(data: typeof menuItems.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(menuItems).values(data);
}

export async function updateMenuItem(id: number, data: Partial<typeof menuItems.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(menuItems).set(data).where(eq(menuItems.id, id));
}

export async function updateMenuItemForRestaurant(
  id: number,
  restaurantId: number,
  data: Partial<typeof menuItems.$inferInsert>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(menuItems).set(data).where(and(eq(menuItems.id, id), eq(menuItems.restaurantId, restaurantId)));
}

export async function deleteMenuItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(menuItems).where(eq(menuItems.id, id));
}

export async function deleteMenuItemForRestaurant(id: number, restaurantId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(menuItems).where(and(eq(menuItems.id, id), eq(menuItems.restaurantId, restaurantId)));
}

export async function duplicateMenuItem(id: number, restaurantId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar item original
  const [original] = await db.select().from(menuItems).where(eq(menuItems.id, id));
  if (!original) throw new Error("Item not found");
  
  // Verificar se o item pertence ao restaurante
  if (original.restaurantId !== restaurantId) {
    throw new Error("Unauthorized: item does not belong to this restaurant");
  }
  
  // Criar cópia com sufixo " (Cópia)"
  const newItem = {
    restaurantId: original.restaurantId,
    categoryId: original.categoryId,
    name: `${original.name} (Cópia)`,
    description: original.description,
    price: original.price,
    imageUrl: original.imageUrl,
    preparationTime: original.preparationTime,
    isAvailable: original.isAvailable,
    isFeatured: false, // Não duplicar destaque
  };
  
  const [inserted] = await db.insert(menuItems).values(newItem);
  return { ...newItem, id: Number(inserted.insertId) };
}

// ============================================
// VARIAÇÕES DE TAMANHO
// ============================================

export async function getVariationsByItemId(itemId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(menuItemVariations).where(eq(menuItemVariations.itemId, itemId));
}

export async function getVariationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(menuItemVariations).where(eq(menuItemVariations.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createVariation(data: typeof menuItemVariations.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(menuItemVariations).values(data);
}

export async function updateVariation(id: number, data: Partial<typeof menuItemVariations.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(menuItemVariations).set(data).where(eq(menuItemVariations.id, id));
}

export async function deleteVariation(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(menuItemVariations).where(eq(menuItemVariations.id, id));
}

export async function bulkUpdateMenuItems(
  restaurantId: number,
  ids: number[],
  data: Partial<typeof menuItems.$inferInsert>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Atualizar apenas itens que pertencem ao restaurante
  return db
    .update(menuItems)
    .set(data)
    .where(
      and(
        inArray(menuItems.id, ids),
        eq(menuItems.restaurantId, restaurantId)
      )
    );
}

export async function createMenuCategory(data: typeof menuCategories.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(menuCategories).values(data);
}

export async function updateMenuCategory(id: number, data: Partial<typeof menuCategories.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(menuCategories).set(data).where(eq(menuCategories.id, id));
}

export async function updateMenuCategoryForRestaurant(
  id: number,
  restaurantId: number,
  data: Partial<typeof menuCategories.$inferInsert>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(menuCategories).set(data).where(and(eq(menuCategories.id, id), eq(menuCategories.restaurantId, restaurantId)));
}

export async function deleteMenuCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(menuCategories).where(eq(menuCategories.id, id));
}

export async function deleteMenuCategoryForRestaurant(id: number, restaurantId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(menuCategories).where(and(eq(menuCategories.id, id), eq(menuCategories.restaurantId, restaurantId)));
}

// ============================================
// ADICIONAIS
// ============================================

export async function getAdditionalsByRestaurant(restaurantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(additionals).where(eq(additionals.restaurantId, restaurantId));
}

export async function getAdditionalById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(additionals).where(eq(additionals.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAdditionalsByItem(itemId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: additionals.id,
    name: additionals.name,
    price: additionals.price,
    isAvailable: additionals.isAvailable,
    isRequired: itemAdditionals.isRequired,
    maxQuantity: itemAdditionals.maxQuantity,
  })
  .from(itemAdditionals)
  .innerJoin(additionals, eq(itemAdditionals.additionalId, additionals.id))
  .where(eq(itemAdditionals.itemId, itemId));
}

export async function createAdditional(data: typeof additionals.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(additionals).values(data);
}

export async function updateAdditional(id: number, data: Partial<typeof additionals.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(additionals).set(data).where(eq(additionals.id, id));
}

export async function updateAdditionalForRestaurant(
  id: number,
  restaurantId: number,
  data: Partial<typeof additionals.$inferInsert>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(additionals).set(data).where(and(eq(additionals.id, id), eq(additionals.restaurantId, restaurantId)));
}

export async function deleteAdditional(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(additionals).where(eq(additionals.id, id));
}

export async function deleteAdditionalForRestaurant(id: number, restaurantId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(additionals).where(and(eq(additionals.id, id), eq(additionals.restaurantId, restaurantId)));
}

// ============================================
// PEDIDOS
// ============================================

export async function createOrder(data: Omit<typeof orders.$inferInsert, 'orderNumber'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Gerar número único do pedido
  const orderNumber = `CH${Date.now().toString().slice(-8)}${nanoid(4).toUpperCase()}`;
  
  return db.insert(orders).values({
    ...data,
    orderNumber,
  });
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getOrdersByCustomer(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const ordersList = await db.select().from(orders).where(eq(orders.customerId, customerId)).orderBy(desc(orders.createdAt));
  
  // Buscar itens e restaurante para cada pedido
  const ordersWithDetails = await Promise.all(
    ordersList.map(async (order) => {
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
      const restaurant = await db.select().from(restaurants).where(eq(restaurants.id, order.restaurantId)).limit(1);
      return {
        ...order,
        items,
        restaurant: restaurant[0] || null,
      };
    })
  );
  
  return ordersWithDetails;
}

export async function getOrdersByRestaurant(restaurantId: number, status?: string) {
  const db = await getDb();
  if (!db) return [];
  
  if (status) {
    return db.select().from(orders)
      .where(and(eq(orders.restaurantId, restaurantId), eq(orders.status, status as any)))
      .orderBy(desc(orders.createdAt));
  }
  
  return db.select().from(orders).where(eq(orders.restaurantId, restaurantId)).orderBy(desc(orders.createdAt));
}

export async function updateOrderStatus(id: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(orders).set({ status: status as any, updatedAt: new Date() }).where(eq(orders.id, id));
}

export async function updateOrderStatusForRestaurant(id: number, restaurantId: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .update(orders)
    .set({ status: status as any, updatedAt: new Date() })
    .where(and(eq(orders.id, id), eq(orders.restaurantId, restaurantId)));
}

export async function createOrderItem(data: typeof orderItems.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Garantir que valores numéricos são válidos
  const cleanData = {
    orderId: Number(data.orderId) || 0,
    itemId: data.itemId ? Number(data.itemId) : null,
    comboId: data.comboId ? Number(data.comboId) : null,
    name: data.name || 'Item',
    quantity: Number(data.quantity) || 1,
    unitPrice: Number(data.unitPrice) || 0,
    subtotal: Number(data.subtotal) || 0,
    notes: data.notes || null,
  };
  
  console.log('[createOrderItem] Inserting with clean data:', JSON.stringify(cleanData));
  
  try {
    // Usar SQL direto para garantir que o insert seja executado
    const result = await db.execute(
      sql`INSERT INTO orderItems (orderId, itemId, comboId, name, quantity, unitPrice, subtotal, notes) 
          VALUES (${cleanData.orderId}, ${cleanData.itemId}, ${cleanData.comboId}, ${cleanData.name}, 
                  ${cleanData.quantity}, ${cleanData.unitPrice}, ${cleanData.subtotal}, ${cleanData.notes})`
    );
    console.log('[createOrderItem] SQL Insert result:', JSON.stringify(result));
    
    return result;
  } catch (error) {
    console.error('[createOrderItem] Insert error:', error);
    throw error;
  }
}

export async function getOrderItems(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

export async function createOrderItemAdditional(data: typeof orderItemAdditionals.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const cleanData = {
    orderItemId: Number(data.orderItemId) || 0,
    additionalId: Number(data.additionalId) || 0,
    name: data.name || 'Adicional',
    quantity: Number(data.quantity) || 1,
    unitPrice: Number(data.unitPrice) || 0,
    subtotal: Number(data.subtotal) || 0,
  };
  
  return db.insert(orderItemAdditionals).values(cleanData);
}

// ============================================
// CUPONS E VOUCHERS
// ============================================

export async function getCouponByCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(coupons)
    .where(and(
      eq(coupons.code, code),
      eq(coupons.isActive, true),
      lte(coupons.validFrom, new Date()),
      gte(coupons.validUntil, new Date())
    ))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getVoucherByCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(vouchers)
    .where(and(
      eq(vouchers.code, code),
      eq(vouchers.isActive, true),
      lte(vouchers.validFrom, new Date()),
      gte(vouchers.validUntil, new Date())
    ))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createCoupon(data: typeof coupons.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(coupons).values(data);
}

export async function createVoucher(data: typeof vouchers.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(vouchers).values(data);
}

export async function getCouponsByRestaurant(restaurantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(coupons).where(eq(coupons.restaurantId, restaurantId)).orderBy(desc(coupons.createdAt));
}

export async function deleteCoupon(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(coupons).where(eq(coupons.id, id));
}

export async function deleteCouponForRestaurant(id: number, restaurantId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(coupons).where(and(eq(coupons.id, id), eq(coupons.restaurantId, restaurantId)));
}

export async function incrementCouponUsage(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(coupons).set({ usedCount: sql`${coupons.usedCount} + 1` }).where(eq(coupons.id, id));
}

export async function incrementVoucherUsage(voucherId: number, orderId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(vouchers).set({ usedCount: sql`${vouchers.usedCount} + 1` }).where(eq(vouchers.id, voucherId));
  await db.insert(voucherUsage).values({ voucherId, orderId, userId });
}

// ============================================
// AVALIAÇÕES
// ============================================

export async function createReview(data: typeof reviews.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(reviews).values(data);
}

export async function getReviewsByRestaurant(restaurantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reviews).where(eq(reviews.restaurantId, restaurantId)).orderBy(desc(reviews.createdAt));
}

export async function updateReviewResponse(id: number, response: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(reviews).set({ 
    restaurantResponse: response, 
    respondedAt: new Date() 
  }).where(eq(reviews.id, id));
}

export async function updateReviewResponseForRestaurant(id: number, restaurantId: number, response: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(reviews).set({
    restaurantResponse: response,
    respondedAt: new Date()
  }).where(and(eq(reviews.id, id), eq(reviews.restaurantId, restaurantId)));
}

// ============================================
// FAVORITOS
// ============================================

export async function getFavoritesByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: favorites.id,
    restaurantId: favorites.restaurantId,
    createdAt: favorites.createdAt,
    restaurant: restaurants,
  })
  .from(favorites)
  .innerJoin(restaurants, eq(favorites.restaurantId, restaurants.id))
  .where(eq(favorites.userId, userId));
}

export async function addFavorite(userId: number, restaurantId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(favorites).values({ userId, restaurantId });
}

export async function removeFavorite(userId: number, restaurantId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(favorites).where(and(eq(favorites.userId, userId), eq(favorites.restaurantId, restaurantId)));
}

// ============================================
// BANNERS
// ============================================

export async function getActiveBanners() {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  return db.select().from(banners)
    .where(and(
      eq(banners.isActive, true),
      sql`(${banners.validFrom} IS NULL OR ${banners.validFrom} <= ${now})`,
      sql`(${banners.validUntil} IS NULL OR ${banners.validUntil} >= ${now})`
    ))
    .orderBy(banners.order);
}

export async function createBanner(data: typeof banners.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(banners).values(data);
}

// ============================================
// VOUCHERS EM DESTAQUE
// ============================================

export async function getFeaturedVouchers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(featuredVouchers)
    .where(eq(featuredVouchers.isActive, true))
    .orderBy(featuredVouchers.order);
}

export async function createFeaturedVoucher(data: typeof featuredVouchers.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(featuredVouchers).values(data);
}

export async function updateFeaturedVoucher(id: number, data: Partial<typeof featuredVouchers.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(featuredVouchers).set(data).where(eq(featuredVouchers.id, id));
}

export async function deleteFeaturedVoucher(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(featuredVouchers).where(eq(featuredVouchers.id, id));
}

export async function getReviewByOrder(orderId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(reviews).where(eq(reviews.orderId, orderId)).limit(1);
  return result[0] || null;
}

export async function getRestaurantAverageRating(restaurantId: number) {
  const db = await getDb();
  if (!db) return { avgRating: 0, totalReviews: 0 };
  const result = await db.select({
    avgRating: sql<number>`AVG(${reviews.overallRating})`,
    totalReviews: sql<number>`COUNT(*)`,
  }).from(reviews).where(eq(reviews.restaurantId, restaurantId));
  return result[0] || { avgRating: 0, totalReviews: 0 };
}


// ============================================
// LIMPEZA DE DADOS
// ============================================

export async function deleteOrdersWithoutItems(): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Primeiro, encontrar pedidos sem itens
  const emptyOrders = await db.execute(sql`
    SELECT o.id 
    FROM orders o 
    LEFT JOIN orderItems oi ON oi.orderId = o.id 
    GROUP BY o.id 
    HAVING COUNT(oi.id) = 0
  `);
  
  const orderIds = (emptyOrders as unknown as any[][])[0].map((row: any) => row.id);
  
  if (orderIds.length === 0) {
    return 0;
  }
  
  // Deletar os pedidos sem itens
  await db.execute(sql`DELETE FROM orders WHERE id IN (${sql.raw(orderIds.join(','))})`);
  
  return orderIds.length;
}


// ============================================
// HORÁRIOS DE FUNCIONAMENTO
// ============================================

export async function getRestaurantHours(restaurantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(restaurantHours).where(eq(restaurantHours.restaurantId, restaurantId));
}

export async function upsertRestaurantHour(data: {
  restaurantId: number;
  dayOfWeek: number;
  openTime?: string;
  closeTime?: string;
  isClosed: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Verificar se já existe um horário para este dia
  const existing = await db.select().from(restaurantHours)
    .where(and(
      eq(restaurantHours.restaurantId, data.restaurantId),
      eq(restaurantHours.dayOfWeek, data.dayOfWeek)
    ))
    .limit(1);
  
  if (existing.length > 0) {
    // Atualizar existente
    return db.update(restaurantHours)
      .set({
        openTime: data.openTime,
        closeTime: data.closeTime,
        isClosed: data.isClosed,
      })
      .where(eq(restaurantHours.id, existing[0].id));
  } else {
    // Criar novo
    return db.insert(restaurantHours).values(data);
  }
}

export async function deleteRestaurantHour(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(restaurantHours).where(eq(restaurantHours.id, id));
}

// ============================================
// DISPONIBILIDADE DE ITENS POR PERÍODO
// ============================================

export async function getItemAvailability(itemId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(itemAvailability).where(eq(itemAvailability.itemId, itemId));
}

export async function createItemAvailability(data: {
  itemId: number;
  period: "breakfast" | "lunch" | "dinner" | "all_day";
  startTime?: string;
  endTime?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(itemAvailability).values(data);
}

export async function deleteItemAvailability(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(itemAvailability).where(eq(itemAvailability.id, id));
}


// ============================================
// COMBOS
// ============================================

export async function getCombosByRestaurant(restaurantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(combos).where(eq(combos.restaurantId, restaurantId));
}

export async function getComboById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(combos).where(eq(combos.id, id)).limit(1);
  return result[0] || null;
}

export async function getComboWithItems(comboId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const combo = await getComboById(comboId);
  if (!combo) return null;
  
  const items = await db
    .select({
      id: comboItems.id,
      itemId: comboItems.itemId,
      quantity: comboItems.quantity,
      itemName: menuItems.name,
      itemPrice: menuItems.price,
      itemImage: menuItems.imageUrl,
    })
    .from(comboItems)
    .leftJoin(menuItems, eq(comboItems.itemId, menuItems.id))
    .where(eq(comboItems.comboId, comboId));
  
  return {
    ...combo,
    items,
  };
}

export async function createCombo(data: {
  restaurantId: number;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isAvailable?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(combos).values(data);
  return (result as any).insertId || result[0]?.insertId || 0;
}

export async function updateCombo(id: number, data: {
  name?: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  isAvailable?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(combos).set(data).where(eq(combos.id, id));
}

export async function deleteCombo(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Deletar itens do combo primeiro
  await db.delete(comboItems).where(eq(comboItems.comboId, id));
  
  // Deletar combo
  return db.delete(combos).where(eq(combos.id, id));
}

// ============================================
// ITENS DO COMBO
// ============================================

export async function getComboItems(comboId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(comboItems).where(eq(comboItems.comboId, comboId));
}

export async function addItemToCombo(data: {
  comboId: number;
  itemId: number;
  quantity: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(comboItems).values(data);
}

export async function removeItemFromCombo(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(comboItems).where(eq(comboItems.id, id));
}

export async function updateComboItemQuantity(id: number, quantity: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(comboItems).set({ quantity }).where(eq(comboItems.id, id));
}

// ============================================
// CRM - CUSTOMER SNAPSHOT
// ============================================

export async function upsertCrmCustomerSnapshot(data: InsertCrmCustomerSnapshot) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Verificar se já existe snapshot para este restaurante+cliente
  const existing = await db.select()
    .from(crmCustomerSnapshot)
    .where(
      and(
        eq(crmCustomerSnapshot.restaurantId, data.restaurantId),
        eq(crmCustomerSnapshot.customerId, data.customerId)
      )
    )
    .limit(1);
  
  if (existing.length > 0) {
    // Atualizar existente
    return db.update(crmCustomerSnapshot)
      .set({
        firstOrderAt: data.firstOrderAt,
        lastOrderAt: data.lastOrderAt,
        ordersCount: data.ordersCount,
        totalSpentCents: data.totalSpentCents,
        avgTicketCents: data.avgTicketCents,
        status: data.status,
        frequencyDaysAvg: data.frequencyDaysAvg,
        updatedAt: new Date(),
      })
      .where(eq(crmCustomerSnapshot.id, existing[0].id));
  } else {
    // Criar novo
    return db.insert(crmCustomerSnapshot).values(data);
  }
}

export async function getCrmCustomerSnapshot(restaurantId: number, customerId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select()
    .from(crmCustomerSnapshot)
    .where(
      and(
        eq(crmCustomerSnapshot.restaurantId, restaurantId),
        eq(crmCustomerSnapshot.customerId, customerId)
      )
    )
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getCrmCustomerSnapshotsByRestaurant(
  restaurantId: number,
  filters?: { status?: string; search?: string }
) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(crmCustomerSnapshot.restaurantId, restaurantId)];
  
  if (filters?.status && filters.status !== 'ALL') {
    conditions.push(eq(crmCustomerSnapshot.status, filters.status as any));
  }
  
  // Se houver busca, precisamos fazer join com users
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    return db.select({
      snapshot: crmCustomerSnapshot,
      customer: users,
    })
      .from(crmCustomerSnapshot)
      .innerJoin(users, eq(crmCustomerSnapshot.customerId, users.id))
      .where(
        and(
          ...conditions,
          sql`(
            LOWER(${users.name}) LIKE ${`%${searchLower}%`} OR
            LOWER(${users.phone}) LIKE ${`%${searchLower}%`} OR
            LOWER(${users.cpf}) LIKE ${`%${searchLower}%`}
          )`
        )
      )
      .orderBy(desc(crmCustomerSnapshot.lastOrderAt));
  }
  
  // Sem busca, apenas join simples
  return db.select({
    snapshot: crmCustomerSnapshot,
    customer: users,
  })
    .from(crmCustomerSnapshot)
    .innerJoin(users, eq(crmCustomerSnapshot.customerId, users.id))
    .where(and(...conditions))
    .orderBy(desc(crmCustomerSnapshot.lastOrderAt));
}

export async function deleteCrmCustomerSnapshot(restaurantId: number, customerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(crmCustomerSnapshot)
    .where(
      and(
        eq(crmCustomerSnapshot.restaurantId, restaurantId),
        eq(crmCustomerSnapshot.customerId, customerId)
      )
    );
}

// ============================================
// CRM - CAMPAIGNS
// ============================================

export async function createCrmCampaign(data: InsertCrmCampaign) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(crmCampaign).values(data);
}

export async function getCrmCampaignsByRestaurant(restaurantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select()
    .from(crmCampaign)
    .where(eq(crmCampaign.restaurantId, restaurantId))
    .orderBy(desc(crmCampaign.createdAt));
}

export async function getCrmCampaignById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select()
    .from(crmCampaign)
    .where(eq(crmCampaign.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateCrmCampaign(id: number, data: Partial<InsertCrmCampaign>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(crmCampaign).set(data).where(eq(crmCampaign.id, id));
}

// ============================================
// CRM - CAMPAIGN LOG
// ============================================

export async function createCrmCampaignLog(data: InsertCrmCampaignLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(crmCampaignLog).values(data);
}

export async function getCrmCampaignLogsByCampaign(campaignId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select()
    .from(crmCampaignLog)
    .where(eq(crmCampaignLog.campaignId, campaignId))
    .orderBy(desc(crmCampaignLog.createdAt));
}
