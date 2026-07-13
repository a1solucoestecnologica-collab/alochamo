import { describe, it, expect } from 'vitest';
import { isRestaurantOpen, getRestaurantStatusMessage, type OperatingHours } from '../shared/restaurantStatus';

describe('isRestaurantOpen', () => {
  const mockOperatingHours: OperatingHours[] = [
    { dayOfWeek: 0, openTime: '10:00', closeTime: '22:00', isClosed: false }, // Domingo
    { dayOfWeek: 1, openTime: '10:00', closeTime: '22:00', isClosed: false }, // Segunda
    { dayOfWeek: 2, openTime: '10:00', closeTime: '22:00', isClosed: false }, // Terça
    { dayOfWeek: 3, openTime: '10:00', closeTime: '22:00', isClosed: false }, // Quarta
    { dayOfWeek: 4, openTime: '10:00', closeTime: '22:00', isClosed: false }, // Quinta
    { dayOfWeek: 5, openTime: '10:00', closeTime: '23:00', isClosed: false }, // Sexta
    { dayOfWeek: 6, openTime: '10:00', closeTime: '23:00', isClosed: false }, // Sábado
  ];

  it('should return isOpen=true when restaurant is currently open', () => {
    // Segunda-feira às 15:00 (dentro do horário 10:00-22:00)
    const now = new Date('2025-01-20T15:00:00');
    const result = isRestaurantOpen(mockOperatingHours, now);
    
    expect(result.isOpen).toBe(true);
    expect(result.closesAt).toBe('22:00');
  });

  it('should return isOpen=false when restaurant is closed (before opening)', () => {
    // Segunda-feira às 09:00 (antes de abrir às 10:00)
    const now = new Date('2025-01-20T09:00:00');
    const result = isRestaurantOpen(mockOperatingHours, now);
    
    expect(result.isOpen).toBe(false);
    expect(result.nextOpenTime).toBe('Hoje às 10:00');
  });

  it('should return isOpen=false when restaurant is closed (after closing)', () => {
    // Segunda-feira às 23:00 (depois de fechar às 22:00)
    const now = new Date('2025-01-20T23:00:00');
    const result = isRestaurantOpen(mockOperatingHours, now);
    
    expect(result.isOpen).toBe(false);
    expect(result.nextOpenTime).toContain('Amanhã');
  });

  it('should return isOpen=false when restaurant is marked as closed for the day', () => {
    const closedOnMonday: OperatingHours[] = [
      { dayOfWeek: 0, openTime: '10:00', closeTime: '22:00', isClosed: false },
      { dayOfWeek: 1, openTime: null, closeTime: null, isClosed: true }, // Segunda fechado
      { dayOfWeek: 2, openTime: '10:00', closeTime: '22:00', isClosed: false },
    ];
    
    // Segunda-feira às 15:00 (mas restaurante está fechado)
    const now = new Date('2025-01-20T15:00:00');
    const result = isRestaurantOpen(closedOnMonday, now);
    
    expect(result.isOpen).toBe(false);
    expect(result.nextOpenTime).toBe('Amanhã às 10:00'); // Terça é amanhã
  });

  it('should handle missing time data gracefully', () => {
    const invalidHours: OperatingHours[] = [
      { dayOfWeek: 1, openTime: null, closeTime: null, isClosed: false },
    ];
    
    const now = new Date('2025-01-20T15:00:00');
    const result = isRestaurantOpen(invalidHours, now);
    
    expect(result.isOpen).toBe(false);
  });

  it('should handle empty operating hours array', () => {
    const now = new Date('2025-01-20T15:00:00');
    const result = isRestaurantOpen([], now);
    
    expect(result.isOpen).toBe(false);
  });

  it('should correctly identify closing time on Friday (different hours)', () => {
    // Sexta-feira às 20:00 (dentro do horário 10:00-23:00)
    const now = new Date('2025-01-24T20:00:00');
    const result = isRestaurantOpen(mockOperatingHours, now);
    
    expect(result.isOpen).toBe(true);
    expect(result.closesAt).toBe('23:00');
  });

  it('should find next opening on Sunday when closed on Saturday night', () => {
    // Sábado às 23:30 (depois de fechar às 23:00)
    const now = new Date('2025-01-25T23:30:00');
    const result = isRestaurantOpen(mockOperatingHours, now);
    
    expect(result.isOpen).toBe(false);
    expect(result.nextOpenTime).toBe('Amanhã às 10:00'); // Domingo é amanhã
  });
});

describe('getRestaurantStatusMessage', () => {
  it('should return "Aberto até HH:MM" when restaurant is open', () => {
    const status = { isOpen: true, closesAt: '22:00' };
    const message = getRestaurantStatusMessage(status);
    
    expect(message).toBe('Aberto até 22:00');
  });

  it('should return "Aberto" when restaurant is open but no closing time', () => {
    const status = { isOpen: true };
    const message = getRestaurantStatusMessage(status);
    
    expect(message).toBe('Aberto');
  });

  it('should return "Abre {time}" when restaurant is closed', () => {
    const status = { isOpen: false, nextOpenTime: 'Amanhã às 10:00' };
    const message = getRestaurantStatusMessage(status);
    
    expect(message).toBe('Abre Amanhã às 10:00');
  });

  it('should return "Fechado" when restaurant is closed with no next opening time', () => {
    const status = { isOpen: false };
    const message = getRestaurantStatusMessage(status);
    
    expect(message).toBe('Fechado');
  });
});
