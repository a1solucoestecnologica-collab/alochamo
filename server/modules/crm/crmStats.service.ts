import * as db from "../../db";
import { eq, and, gte, sql } from "drizzle-orm";
import { orders, crmCustomerSnapshot } from "../../../drizzle/schema";
import { getDb } from "../../db";

/**
 * Serviço para calcular e atualizar estatísticas de clientes do CRM
 */

interface CustomerStats {
  customerId: number;
  firstOrderAt: Date | null;
  lastOrderAt: Date | null;
  ordersCount: number;
  totalSpentCents: number;
  avgTicketCents: number;
  frequencyDaysAvg: number | null;
  status: "NEW" | "RECURRING" | "INACTIVE" | "VIP" | "PROMO";
}

/**
 * Calcula estatísticas de um cliente específico para um restaurante
 */
async function calculateCustomerStats(
  restaurantId: number,
  customerId: number
): Promise<CustomerStats | null> {
  const dbInstance = await getDb();
  if (!dbInstance) throw new Error("Database not available");

  // Buscar todos os pedidos do cliente neste restaurante
  const customerOrders = await dbInstance
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.restaurantId, restaurantId),
        eq(orders.customerId, customerId),
        // Excluir pedidos cancelados do cálculo
        sql`${orders.status} != 'cancelled'`
      )
    )
    .orderBy(orders.createdAt);

  if (customerOrders.length === 0) {
    return null; // Cliente não tem pedidos neste restaurante
  }

  const ordersCount = customerOrders.length;
  const firstOrderAt = customerOrders[0].createdAt;
  const lastOrderAt = customerOrders[ordersCount - 1].createdAt;
  
  // Calcular total gasto (soma dos totais dos pedidos)
  const totalSpentCents = customerOrders.reduce(
    (sum, order) => sum + order.total,
    0
  );
  
  // Calcular ticket médio
  const avgTicketCents = Math.round(totalSpentCents / ordersCount);
  
  // Calcular frequência média (diferença média entre pedidos)
  let frequencyDaysAvg: number | null = null;
  if (ordersCount >= 2) {
    const intervals: number[] = [];
    for (let i = 1; i < ordersCount; i++) {
      const daysDiff =
        (customerOrders[i].createdAt.getTime() -
          customerOrders[i - 1].createdAt.getTime()) /
        (1000 * 60 * 60 * 24);
      intervals.push(daysDiff);
    }
    frequencyDaysAvg =
      intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
  }

  // Determinar status
  let status: "NEW" | "RECURRING" | "INACTIVE" | "VIP" | "PROMO" = "NEW";
  
  const daysSinceLastOrder =
    (Date.now() - lastOrderAt.getTime()) / (1000 * 60 * 60 * 24);
  
  if (ordersCount === 1) {
    status = "NEW";
  } else if (daysSinceLastOrder <= 30) {
    status = "RECURRING";
  } else {
    status = "INACTIVE";
  }
  
  // VIP: top 10% por total_spent nos últimos 90 dias OU orders_count >= 8
  if (ordersCount >= 8) {
    status = "VIP";
  } else {
    // Verificar se está no top 10% dos últimos 90 dias
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const recentOrders = customerOrders.filter(
      (o) => o.createdAt >= ninetyDaysAgo
    );
    
    if (recentOrders.length > 0) {
      // Buscar todos os clientes com pedidos nos últimos 90 dias
      const allRecentOrders = await dbInstance
        .select({
          customerId: orders.customerId,
          total: orders.total,
        })
        .from(orders)
        .where(
          and(
            eq(orders.restaurantId, restaurantId),
            gte(orders.createdAt, ninetyDaysAgo),
            sql`${orders.status} != 'cancelled'`
          )
        );
      
      // Agrupar por cliente e somar totais
      const customerTotals = new Map<number, number>();
      for (const order of allRecentOrders) {
        const current = customerTotals.get(order.customerId) || 0;
        customerTotals.set(order.customerId, current + order.total);
      }
      
      // Ordenar por total gasto
      const sortedTotals = Array.from(customerTotals.values()).sort(
        (a, b) => b - a
      );
      
      // Calcular threshold do top 10%
      const top10PercentIndex = Math.floor(sortedTotals.length * 0.1);
      const top10PercentThreshold =
        sortedTotals[top10PercentIndex] || 0;
      
      const customerTotal = recentOrders.reduce(
        (sum, o) => sum + o.total,
        0
      );
      
      if (customerTotal >= top10PercentThreshold && customerTotal > 0) {
        status = "VIP";
      }
    }
  }

  return {
    customerId,
    firstOrderAt,
    lastOrderAt,
    ordersCount,
    totalSpentCents,
    avgTicketCents,
    frequencyDaysAvg: frequencyDaysAvg ? Number(frequencyDaysAvg.toFixed(2)) : null,
    status,
  };
}

/**
 * Recalcula estatísticas de todos os clientes de um restaurante
 * @param restaurantId ID do restaurante
 * @param batchSize Tamanho do lote para processar (padrão: 50)
 */
export async function recomputeStats(
  restaurantId: number,
  batchSize: number = 50
): Promise<{ processed: number; errors: number }> {
  const dbInstance = await getDb();
  if (!dbInstance) throw new Error("Database not available");

  // Buscar todos os clientes únicos que fizeram pedidos neste restaurante
  const uniqueCustomers = await dbInstance
    .selectDistinct({ customerId: orders.customerId })
    .from(orders)
    .where(
      and(
        eq(orders.restaurantId, restaurantId),
        sql`${orders.status} != 'cancelled'`
      )
    );

  let processed = 0;
  let errors = 0;

  // Processar em lotes para não sobrecarregar o banco
  for (let i = 0; i < uniqueCustomers.length; i += batchSize) {
    const batch = uniqueCustomers.slice(i, i + batchSize);
    
    await Promise.all(
      batch.map(async ({ customerId }) => {
        try {
          const stats = await calculateCustomerStats(restaurantId, customerId);
          
          if (stats) {
            await db.upsertCrmCustomerSnapshot({
              restaurantId,
              customerId: stats.customerId,
              firstOrderAt: stats.firstOrderAt,
              lastOrderAt: stats.lastOrderAt,
              ordersCount: stats.ordersCount,
              totalSpentCents: stats.totalSpentCents,
              avgTicketCents: stats.avgTicketCents,
              status: stats.status,
              frequencyDaysAvg: stats.frequencyDaysAvg
                ? String(stats.frequencyDaysAvg)
                : null,
            });
            processed++;
          }
        } catch (error) {
          console.error(
            `[CRM Stats] Erro ao processar cliente ${customerId}:`,
            error
          );
          errors++;
        }
      })
    );
  }

  return { processed, errors };
}

/**
 * Recalcula estatísticas de um cliente específico
 */
export async function recomputeCustomerStats(
  restaurantId: number,
  customerId: number
): Promise<void> {
  const stats = await calculateCustomerStats(restaurantId, customerId);
  
  if (stats) {
    await db.upsertCrmCustomerSnapshot({
      restaurantId,
      customerId: stats.customerId,
      firstOrderAt: stats.firstOrderAt,
      lastOrderAt: stats.lastOrderAt,
      ordersCount: stats.ordersCount,
      totalSpentCents: stats.totalSpentCents,
      avgTicketCents: stats.avgTicketCents,
      status: stats.status,
      frequencyDaysAvg: stats.frequencyDaysAvg ? String(stats.frequencyDaysAvg) : null,
    });
  } else {
    // Se não há pedidos, remover snapshot se existir
    await db.deleteCrmCustomerSnapshot(restaurantId, customerId);
  }
}
