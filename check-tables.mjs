import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const url = new URL(connectionString.replace('mysql://', 'mysql://'));
const user = url.username || 'root';
const password = url.password || '';
const host = url.hostname || 'localhost';
const port = url.port || 3306;
const database = url.pathname.replace('/', '') || 'chamo';

try {
  const connection = await mysql.createConnection({
    host,
    port: parseInt(port),
    user,
    password,
    database,
  });

  const [tables] = await connection.query('SHOW TABLES');
  console.log(`Tabelas existentes (${tables.length}):`);
  tables.forEach(row => {
    console.log(`  - ${Object.values(row)[0]}`);
  });

  await connection.end();
  process.exit(0);
} catch (error) {
  console.error('Erro:', error.message);
  process.exit(1);
}
