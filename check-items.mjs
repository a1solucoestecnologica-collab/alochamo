import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL);

async function main() {
  const result = await db.execute(sql`SELECT id, orderId, name FROM orderItems ORDER BY id DESC LIMIT 15`);
  console.log('Items:', result[0]);
}

main().catch(console.error);
