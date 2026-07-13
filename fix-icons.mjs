import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { restaurantCategories } from "./drizzle/schema.ts";
import "dotenv/config";

const db = drizzle(process.env.DATABASE_URL);

async function fixCategoryIcons() {
  console.log("🎨 Corrigindo ícones das categorias...");

  const categories = [

    {
      slug: "pizza",
      icon: "https://img.icons8.com/color/96/pizza.png"
    },
    {
      slug: "hamburguer",
      icon: "https://img.icons8.com/color/96/hamburger.png"
    },
    {
      slug: "japonesa",
      icon: "https://img.icons8.com/color/96/sushi.png"
    },
    {
      slug: "italiana",
      icon: "https://img.icons8.com/color/96/spaghetti.png"
    },
    {
      slug: "brasileira",
      icon: "https://img.icons8.com/color/96/brazil.png"
    },
    {
      slug: "lanches",
      icon: "https://img.icons8.com/color/96/french-fries.png"
    },
    {
      slug: "sobremesas",
      icon: "https://img.icons8.com/color/96/ice-cream-cone.png"
    },
  ];

  for (const category of categories) {
    await db.update(restaurantCategories)
      .set({ icon: category.icon })
      .where(eq(restaurantCategories.slug, category.slug));
    console.log(`  ✓ ${category.slug} atualizado`);
  }

  console.log("✅ Ícones das categorias corrigidos!");
  process.exit(0);
}

fixCategoryIcons().catch(console.error);
