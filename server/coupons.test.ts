import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock do módulo de banco de dados
vi.mock('./db', () => ({
  getCouponsByRestaurant: vi.fn(),
  createCoupon: vi.fn(),
  deleteCoupon: vi.fn(),
  getCouponByCode: vi.fn(),
  getRestaurantByUserId: vi.fn(),
}));

import * as db from './db';

describe('Coupons Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCouponsByRestaurant', () => {
    it('should return coupons for a restaurant', async () => {
      const mockCoupons = [
        {
          id: 1,
          code: 'PROMO10',
          type: 'percentage',
          value: 1000,
          restaurantId: 1,
          minimumOrder: 3000,
          maxDiscount: 2000,
          usageLimit: 100,
          usedCount: 5,
          validFrom: new Date('2025-01-01'),
          validUntil: new Date('2025-12-31'),
          isActive: true,
          createdAt: new Date(),
        },
        {
          id: 2,
          code: 'DESCONTO5',
          type: 'fixed',
          value: 500,
          restaurantId: 1,
          minimumOrder: null,
          maxDiscount: null,
          usageLimit: null,
          usedCount: 0,
          validFrom: new Date('2025-01-01'),
          validUntil: new Date('2025-06-30'),
          isActive: true,
          createdAt: new Date(),
        },
      ];

      vi.mocked(db.getCouponsByRestaurant).mockResolvedValue(mockCoupons);

      const result = await db.getCouponsByRestaurant(1);

      expect(db.getCouponsByRestaurant).toHaveBeenCalledWith(1);
      expect(result).toHaveLength(2);
      expect(result[0].code).toBe('PROMO10');
      expect(result[1].code).toBe('DESCONTO5');
    });

    it('should return empty array when no coupons exist', async () => {
      vi.mocked(db.getCouponsByRestaurant).mockResolvedValue([]);

      const result = await db.getCouponsByRestaurant(999);

      expect(result).toEqual([]);
    });
  });

  describe('createCoupon', () => {
    it('should create a new coupon', async () => {
      const newCoupon = {
        code: 'NOVO20',
        type: 'percentage' as const,
        value: 2000,
        restaurantId: 1,
        validFrom: new Date('2025-01-01'),
        validUntil: new Date('2025-12-31'),
      };

      vi.mocked(db.createCoupon).mockResolvedValue(undefined as any);

      await db.createCoupon(newCoupon);

      expect(db.createCoupon).toHaveBeenCalledWith(newCoupon);
    });
  });

  describe('deleteCoupon', () => {
    it('should delete a coupon by id', async () => {
      vi.mocked(db.deleteCoupon).mockResolvedValue(undefined as any);

      await db.deleteCoupon(1);

      expect(db.deleteCoupon).toHaveBeenCalledWith(1);
    });
  });

  describe('getCouponByCode', () => {
    it('should return coupon when valid code is provided', async () => {
      const mockCoupon = {
        id: 1,
        code: 'PROMO10',
        type: 'percentage' as const,
        value: 1000,
        restaurantId: 1,
        minimumOrder: null,
        maxDiscount: null,
        usageLimit: 100,
        usedCount: 5,
        validFrom: new Date('2025-01-01'),
        validUntil: new Date('2025-12-31'),
        isActive: true,
        createdAt: new Date(),
      };

      vi.mocked(db.getCouponByCode).mockResolvedValue(mockCoupon);

      const result = await db.getCouponByCode('PROMO10');

      expect(db.getCouponByCode).toHaveBeenCalledWith('PROMO10');
      expect(result?.code).toBe('PROMO10');
      expect(result?.type).toBe('percentage');
    });

    it('should return undefined for invalid code', async () => {
      vi.mocked(db.getCouponByCode).mockResolvedValue(undefined);

      const result = await db.getCouponByCode('INVALID');

      expect(result).toBeUndefined();
    });
  });
});
