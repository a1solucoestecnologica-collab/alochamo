import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const url = new URL(connectionString.replace('mysql://', 'mysql://'));
const user = url.username || 'root';
const password = url.password || '';
const host = url.hostname || 'localhost';
const port = url.port || 3306;
const database = url.pathname.replace('/', '') || 'chamo';

console.log('Aplicando migrações manualmente...');

try {
  const connection = await mysql.createConnection({
    host,
    port: parseInt(port),
    user,
    password,
    database,
    multipleStatements: true,
  });

  // Ajustar modo SQL
  await connection.query("SET SESSION sql_mode = 'NO_ENGINE_SUBSTITUTION'");
  console.log('✓ Modo SQL ajustado');

  // Aplicar migrações em ordem
  const migrations = [
    '0000_smooth_baron_strucker.sql',
    '0001_aberrant_sersi.sql',
    '0002_faulty_fabian_cortez.sql',
    '0003_melted_roughhouse.sql',
    '0004_premium_zzzax.sql',
    '0005_lowly_imperial_guard.sql',
    '0006_smiling_songbird.sql',
    '0007_workable_the_stranger.sql',
    '0008_fat_hydra.sql',
    '0009_freezing_texas_twister.sql',
    '0010_short_salo.sql',
  ];

  for (const migration of migrations) {
    try {
      const sql = readFileSync(join(process.cwd(), 'drizzle', migration), 'utf-8');
      // Substituir DEFAULT (now()) por DEFAULT CURRENT_TIMESTAMP para compatibilidade
      const fixedSql = sql.replace(/DEFAULT \(now\(\)\)/g, 'DEFAULT CURRENT_TIMESTAMP');
      await connection.query(fixedSql);
      console.log(`✓ ${migration} aplicada`);
    } catch (error) {
      if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.message.includes('already exists')) {
        console.log(`⚠ ${migration} já aplicada (pulando)`);
      } else {
        console.error(`✗ Erro em ${migration}:`, error.message);
        throw error;
      }
    }
  }

  await connection.end();
  console.log('✓ Todas as migrações aplicadas');
  process.exit(0);
} catch (error) {
  console.error('✗ Erro:', error.message);
  process.exit(1);
}
