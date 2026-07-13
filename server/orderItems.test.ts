import { describe, it, expect, beforeAll } from 'vitest';
import { createOrderItem, getOrderItems, getDb } from './db';

describe('Order Items', () => {
  beforeAll(async () => {
    // Verificar se o banco está disponível
    const db = await getDb();
    expect(db).not.toBeNull();
  });

  it('should create an order item directly', async () => {
    const testOrderId = 60009; // Pedido existente
    
    const itemData = {
      orderId: testOrderId,
      itemId: 1,
      comboId: null,
      name: 'Test Item',
      quantity: 1,
      unitPrice: 10.00,
      subtotal: 10.00,
      notes: null,
    };
    
    console.log('Creating order item with data:', itemData);
    
    const result = await createOrderItem(itemData);
    console.log('Create result:', result);
    
    // Verificar se o item foi criado
    const items = await getOrderItems(testOrderId);
    console.log('Items found:', items);
    
    expect(items.length).toBeGreaterThan(0);
  });
});
