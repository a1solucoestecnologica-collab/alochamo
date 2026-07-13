import { getDb } from "./db";
import { restaurantVouchers, voucherMetrics } from "../drizzle/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

/**
 * Verifica se um restaurante pode criar um voucher na data especificada
 * Regras:
 * - Máximo 5 vouchers por dia (cidade inteira)
 * - Máximo 1 voucher por restaurante por dia
 * - Restaurante não pode ativar vouchers em dias consecutivos
 */
export async function canCreateVoucher(restaurantId: number, date: string): Promise<{
  canCreate: boolean;
  reason?: string;
}> {
  // Verificar se já existe voucher do restaurante nesta data
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existingVoucher = await db
    .select()
    .from(restaurantVouchers)
    .where(
      and(
        eq(restaurantVouchers.restaurantId, restaurantId),
        sql`date = ${date}`
      )
    )
    .limit(1);

  if (existingVoucher.length > 0) {
    return {
      canCreate: false,
      reason: "Você já possui um voucher nesta data."
    };
  }

  // Verificar limite de 5 vouchers por dia
  const vouchersOnDate = await db
    .select({ count: sql<number>`count(*)` })
    .from(restaurantVouchers)
    .where(sql`date = ${date}`);

  const count = Number(vouchersOnDate[0]?.count || 0);
  
  if (count >= 5) {
    return {
      canCreate: false,
      reason: "Limite diário de vouchers atingido. Escolha outra data."
    };
  }

  // Verificar dias consecutivos
  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const tomorrow = new Date(date);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const consecutiveVouchers = await db
    .select()
    .from(restaurantVouchers)
    .where(
      and(
        eq(restaurantVouchers.restaurantId, restaurantId),
        sql`date IN (${yesterdayStr}, ${tomorrowStr})`
      )
    );

  if (consecutiveVouchers.length > 0) {
    return {
      canCreate: false,
      reason: "Não é permitido criar vouchers em dias consecutivos."
    };
  }

  return { canCreate: true };
}

/**
 * Atualiza o status dos vouchers automaticamente baseado na data atual
 */
export async function updateVoucherStatuses() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const today = new Date().toISOString().split('T')[0];

  // Ativar vouchers agendados para hoje
  await db
    .update(restaurantVouchers)
    .set({ status: "ATIVO" })
    .where(
      and(
        sql`date = ${today}`,
        eq(restaurantVouchers.status, "AGENDADO")
      )
    );

  // Expirar vouchers de dias anteriores
  await db
    .update(restaurantVouchers)
    .set({ status: "EXPIRADO" })
    .where(
      and(
        sql`date < ${today}`,
        sql`status != 'EXPIRADO'`
      )
    );
}

/**
 * Busca vouchers ativos do dia
 */
export async function getActiveVouchers() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const today = new Date().toISOString().split('T')[0];
  
  // Atualizar status antes de buscar
  await updateVoucherStatuses();

  return db
    .select()
    .from(restaurantVouchers)
    .where(
      and(
        sql`date = ${today}`,
        eq(restaurantVouchers.status, "ATIVO"),
        sql`usedCount < quantity`
      )
    )
    .limit(5);
}

/**
 * Registra métrica de voucher
 */
export async function trackVoucherMetric(
  voucherId: number,
  eventType: "VIEW" | "CLICK" | "WHATSAPP_CLICK",
  userId?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(voucherMetrics).values({
    voucherId,
    eventType,
    userId: userId || null,
  });
}

/**
 * Busca métricas de um voucher
 */
export async function getVoucherMetrics(voucherId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const metrics = await db
    .select({
      eventType: voucherMetrics.eventType,
      count: sql<number>`count(*)`,
    })
    .from(voucherMetrics)
    .where(eq(voucherMetrics.voucherId, voucherId))
    .groupBy(voucherMetrics.eventType);

  return {
    views: Number(metrics.find((m: any) => m.eventType === "VIEW")?.count || 0),
    clicks: Number(metrics.find((m: any) => m.eventType === "CLICK")?.count || 0),
    whatsappClicks: Number(metrics.find((m: any) => m.eventType === "WHATSAPP_CLICK")?.count || 0),
  };
}
