import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL não encontrada no .env');
  process.exit(1);
}

// Extrair informações da URL
const url = new URL(connectionString.replace('mysql://', 'mysql://'));
const user = url.username || 'root';
const password = url.password || '';
const host = url.hostname || 'localhost';
const port = url.port || 3306;
const database = url.pathname.replace('/', '') || 'chamo';

console.log(`Conectando ao MySQL em ${host}:${port}...`);

try {
  // Conectar sem especificar o banco
  const connection = await mysql.createConnection({
    host,
    port: parseInt(port),
    user,
    password,
  });

  console.log('✓ Conectado ao MySQL');

  // Criar banco se não existir
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
  console.log(`✓ Banco '${database}' criado ou já existe`);

  await connection.end();
  console.log('✓ Conexão fechada');
  process.exit(0);
} catch (error) {
  console.error('✗ Erro:', error.message);
  process.exit(1);
}
