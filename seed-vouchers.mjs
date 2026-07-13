import { drizzle } from "drizzle-orm/mysql2";
import { featuredVouchers } from "./drizzle/schema.ts";
import "dotenv/config";

const db = drizzle(process.env.DATABASE_URL);

async function seedFeaturedVouchers() {
  console.log("🎟️ Populando vouchers em destaque...");

  const vouchers = [
    {
      title: "Pizza Grátis!",
      description: "Na compra de 2 pizzas grandes",
      imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&h=300&fit=crop",
      code: "PIZZA2X1",
      discountType: "free_item",
      discountValue: 0,
      minOrderValue: 8000, // R$ 80,00
      usageLimit: 100,
      order: 1,
      isActive: true,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
    },
    {
      title: "50% OFF em Hambúrgueres",
      description: "Válido para qualquer hambúrguer",
      imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&h=300&fit=crop",
      code: "BURGER50",
      discountType: "percentage",
      discountValue: 50,
      minOrderValue: 3000, // R$ 30,00
      maxDiscount: 2500, // R$ 25,00
      usageLimit: 200,
      order: 2,
      isActive: true,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 dias
    },
    {
      title: "R$ 15 OFF",
      description: "Em pedidos acima de R$ 50",
      imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&h=300&fit=crop",
      code: "DESCONTO15",
      discountType: "fixed",
      discountValue: 1500, // R$ 15,00
      minOrderValue: 5000, // R$ 50,00
      usageLimit: 500,
      order: 3,
      isActive: true,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
    },
    {
      title: "Sobremesa Grátis",
      description: "Em qualquer pedido",
      imageUrl: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=500&h=300&fit=crop",
      code: "DOCE GRATIS",
      discountType: "free_item",
      discountValue: 0,
      minOrderValue: 2500, // R$ 25,00
      usageLimit: 150,
      order: 4,
      isActive: true,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 dias
    },
  ];

  for (const voucher of vouchers) {
    await db.insert(featuredVouchers).values(voucher);
    console.log(`  ✓ ${voucher.title} criado`);
  }

  console.log("✅ Vouchers em destaque populados!");
  process.exit(0);
}

seedFeaturedVouchers().catch(console.error);
