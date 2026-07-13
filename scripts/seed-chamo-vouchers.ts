import { getDb } from "../server/db";
import { restaurantVouchers } from "../drizzle/schema";

async function seedChamoVouchers() {
  const db = await getDb();
  if (!db) {
    console.error("❌ Erro: Banco de dados não disponível");
    process.exit(1);
  }
  
  console.log("🎫 Populando Vouchers Chamô...");

  // Data de hoje
  const today = new Date().toISOString().split('T')[0];

  const vouchers = [
    {
      restaurantId: 3, // Sushi Master
      date: today,
      type: "DESCONTO_VALOR" as const,
      title: "R$ 20 OFF em Pedidos Acima de R$ 80",
      description: "Ganhe R$ 20 de desconto em pedidos acima de R$ 80 no Sushi Master. Válido apenas hoje!",
      imageUrl: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=400&fit=crop",
      discountValue: 2000, // R$ 20 em centavos
      minimumOrder: 8000, // R$ 80 em centavos
      quantity: 50,
      usedCount: 0,
      status: "ATIVO" as const,
    },
    {
      restaurantId: 1, // Bella Napoli
      date: today,
      type: "DESCONTO_VALOR" as const,
      title: "R$ 15 OFF na Primeira Compra",
      description: "Primeira vez na Bella Napoli? Ganhe R$ 15 OFF! Não perca essa chance.",
      imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=400&fit=crop",
      discountValue: 1500, // R$ 15 em centavos
      minimumOrder: 5000, // R$ 50 em centavos
      quantity: 100,
      usedCount: 0,
      status: "ATIVO" as const,
    },
    {
      restaurantId: 2, // Burger House
      date: today,
      type: "BRINDE" as const,
      title: "Batata Frita Grátis",
      description: "Compre qualquer combo e ganhe uma batata frita média grátis! Só hoje no Burger House.",
      imageUrl: "https://images.unsplash.com/photo-1576107232684-1279f390859f?w=800&h=400&fit=crop",
      discountValue: null,
      minimumOrder: 3000, // R$ 30 em centavos
      quantity: 75,
      usedCount: 0,
      status: "ATIVO" as const,
    },
  ];

  for (const voucher of vouchers) {
    await db.insert(restaurantVouchers).values(voucher);
    console.log(`✅ Voucher criado: ${voucher.title}`);
  }

  console.log("\n🎉 Vouchers Chamô populados com sucesso!");
  console.log(`📊 Total: ${vouchers.length} vouchers ativos para hoje (${today})`);
  
  process.exit(0);
}

seedChamoVouchers().catch((error) => {
  console.error("❌ Erro ao popular vouchers:", error);
  process.exit(1);
});
