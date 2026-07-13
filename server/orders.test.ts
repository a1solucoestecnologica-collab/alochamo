import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock do módulo de banco de dados
vi.mock('./db', () => ({
  createOrder: vi.fn(),
  createOrderItem: vi.fn(),
  getOrderById: vi.fn(),
  getOrdersByCustomer: vi.fn(),
  getOrdersByRestaurant: vi.fn(),
  getOrderItems: vi.fn(),
  getRestaurantByUserId: vi.fn(),
  updateOrderStatus: vi.fn(),
}));

import * as db from './db';

describe('Orders Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createOrder', () => {
    it('should create an order with correct data', async () => {
      const mockOrderResult = { insertId: 123 };
      const mockItemResult = { insertId: 456 };

      vi.mocked(db.createOrder).mockResolvedValue(mockOrderResult as any);
      vi.mocked(db.createOrderItem).mockResolvedValue(mockItemResult as any);

      const orderData = {
        customerId: 1,
        restaurantId: 2,
        deliveryStreet: 'Rua Teste',
        deliveryNumber: '123',
        deliveryNeighborhood: 'Centro',
        deliveryCity: 'São Paulo',
        deliveryState: 'SP',
        deliveryZipCode: '01234-567',
        subtotal: 5000,
        deliveryFee: 500,
        serviceFee: 99,
        discount: 0,
        total: 5599,
        status: 'received',
      };

      const result = await db.createOrder(orderData);

      expect(db.createOrder).toHaveBeenCalledWith(orderData);
      expect(result).toEqual(mockOrderResult);
    });

    it('should create order items correctly', async () => {
      const mockItemResult = { insertId: 456 };
      vi.mocked(db.createOrderItem).mockResolvedValue(mockItemResult as any);

      const itemData = {
        orderId: 123,
        itemId: 1,
        name: 'Pizza Margherita',
        quantity: 2,
        unitPrice: 2500,
        subtotal: 5000,
      };

      const result = await db.createOrderItem(itemData);

      expect(db.createOrderItem).toHaveBeenCalledWith(itemData);
      expect(result).toEqual(mockItemResult);
    });
  });

  describe('getOrderById', () => {
    it('should return order when found', async () => {
      const mockOrder = {
        id: 123,
        orderNumber: 'CH12345678ABCD',
        customerId: 1,
        restaurantId: 2,
        status: 'received',
        total: 5599,
        createdAt: new Date(),
      };

      vi.mocked(db.getOrderById).mockResolvedValue(mockOrder);

      const result = await db.getOrderById(123);

      expect(db.getOrderById).toHaveBeenCalledWith(123);
      expect(result).toEqual(mockOrder);
    });

    it('should return undefined when order not found', async () => {
      vi.mocked(db.getOrderById).mockResolvedValue(undefined);

      const result = await db.getOrderById(999);

      expect(result).toBeUndefined();
    });
  });

  describe('getOrdersByCustomer', () => {
    it('should return customer orders', async () => {
      const mockOrders = [
        { id: 1, customerId: 1, status: 'delivered' },
        { id: 2, customerId: 1, status: 'received' },
      ];

      vi.mocked(db.getOrdersByCustomer).mockResolvedValue(mockOrders as any);

      const result = await db.getOrdersByCustomer(1);

      expect(db.getOrdersByCustomer).toHaveBeenCalledWith(1);
      expect(result).toHaveLength(2);
    });
  });

  describe('getOrdersByRestaurant', () => {
    it('should return restaurant orders', async () => {
      const mockOrders = [
        { id: 1, restaurantId: 2, status: 'received' },
        { id: 2, restaurantId: 2, status: 'preparing' },
      ];

      vi.mocked(db.getOrdersByRestaurant).mockResolvedValue(mockOrders as any);

      const result = await db.getOrdersByRestaurant(2);

      expect(db.getOrdersByRestaurant).toHaveBeenCalledWith(2);
      expect(result).toHaveLength(2);
    });

    it('should filter by status when provided', async () => {
      const mockOrders = [
        { id: 1, restaurantId: 2, status: 'received' },
      ];

      vi.mocked(db.getOrdersByRestaurant).mockResolvedValue(mockOrders as any);

      const result = await db.getOrdersByRestaurant(2, 'received');

      expect(db.getOrdersByRestaurant).toHaveBeenCalledWith(2, 'received');
      expect(result).toHaveLength(1);
    });
  });

  describe('getOrderItems', () => {
    it('should return order items', async () => {
      const mockItems = [
        { id: 1, orderId: 123, name: 'Pizza', quantity: 2 },
        { id: 2, orderId: 123, name: 'Refrigerante', quantity: 1 },
      ];

      vi.mocked(db.getOrderItems).mockResolvedValue(mockItems as any);

      const result = await db.getOrderItems(123);

      expect(db.getOrderItems).toHaveBeenCalledWith(123);
      expect(result).toHaveLength(2);
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status', async () => {
      vi.mocked(db.updateOrderStatus).mockResolvedValue(undefined as any);

      await db.updateOrderStatus(123, 'preparing');

      expect(db.updateOrderStatus).toHaveBeenCalledWith(123, 'preparing');
    });
  });
});
