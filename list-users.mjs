import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { users } from "./drizzle/schema.ts";

const connection = await mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "chamo",
});

const db = drizzle(connection);
const allUsers = await db.select().from(users);

console.log("Usuários no banco:");
allUsers.forEach(u => {
  console.log(`ID: ${u.id}, Email: ${u.email}, CPF: ${u.cpf}, Type: ${u.userType}, OpenID: ${u.openId}`);
});

await connection.end();
