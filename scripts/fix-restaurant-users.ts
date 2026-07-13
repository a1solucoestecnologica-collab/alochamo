import { getDb } from "../server/db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

async function fixRestaurantUsers() {
  const db = await getDb();
  
  if (!db) {
    console.error("Failed to connect to database");
    process.exit(1);
  }
  
  // Emails dos restaurantes
  const restaurantEmails = [
    "contato@sushimaster.com",
    "contato@burgerhouse.com",
    "contato@bellanapoli.com"
  ];
  
  for (const email of restaurantEmails) {
    console.log(`Updating userType for ${email}...`);
    const result = await db.update(users)
      .set({ userType: "restaurante" })
      .where(eq(users.email, email));
    console.log(`Result:`, result);
  }
  
  // Verificar
  const updatedUsers = await db.select({
    id: users.id,
    email: users.email,
    userType: users.userType
  }).from(users).where(eq(users.email, "contato@sushimaster.com"));
  
  console.log("Updated user:", updatedUsers);
  
  process.exit(0);
}

fixRestaurantUsers().catch(console.error);
