import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { orderItems } from './drizzle/schema.ts';

async function testOrderItems() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'chamo',
  });

  const db = drizzle(connection);

  console.log('Testing order item creation...');

  try {
    // Tentar criar um item de pedido diretamente
    const testItem = {
      orderId: 60009,
      itemId: 8,
      comboId: null,
      name: 'Sushi de Salmão (teste)',
      quantity: 1,
      unitPrice: 3500,
      subtotal: 3500,
      notes: null,
    };

    console.log('Inserting test item:', testItem);
    
    const result = await db.insert(orderItems).values(testItem);
    console.log('Insert result:', result);
    
    // Verificar se foi criado
    const [rows] = await connection.execute('SELECT * FROM orderItems WHERE orderId = 60009');
    console.log('Items in database:', rows);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

testOrderItems();
