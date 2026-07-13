import { getDb } from './server/db.ts';
import { restaurants } from './drizzle/schema.ts';

const db = await getDb();
const result = await db.select().from(restaurants);
console.log(JSON.stringify(result, null, 2));
