/**
 * Helper functions to check if a restaurant is open based on operating hours
 */

export interface OperatingHours {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  openTime: string | null; // HH:MM format
  closeTime: string | null; // HH:MM format
  isClosed: boolean;
}

export interface RestaurantStatusResult {
  isOpen: boolean;
  nextOpenTime?: string; // Human-readable next opening time
  closesAt?: string; // When it closes today (if open)
}

/**
 * Check if a restaurant is currently open based on its operating hours
 */
export function isRestaurantOpen(
  operatingHours: OperatingHours[],
  now: Date = new Date()
): RestaurantStatusResult {
  const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
  const currentTime = now.getHours() * 60 + now.getMinutes(); // Minutes since midnight

  // Find today's hours
  const todayHours = operatingHours.find(h => h.dayOfWeek === currentDay);

  if (!todayHours || todayHours.isClosed) {
    // Restaurant is closed today, find next opening
    const nextOpenTime = findNextOpenTime(operatingHours, now);
    return {
      isOpen: false,
      nextOpenTime,
    };
  }

  // Parse open and close times
  if (!todayHours.openTime || !todayHours.closeTime) {
    // Missing time data, treat as closed
    const nextOpenTime = findNextOpenTime(operatingHours, now);
    return {
      isOpen: false,
      nextOpenTime,
    };
  }
  
  const [openHour, openMin] = todayHours.openTime.split(':').map(Number);
  const [closeHour, closeMin] = todayHours.closeTime.split(':').map(Number);
  
  const openTime = openHour * 60 + openMin;
  const closeTime = closeHour * 60 + closeMin;

  // Check if currently open
  if (currentTime >= openTime && currentTime < closeTime) {
    return {
      isOpen: true,
      closesAt: todayHours.closeTime,
    };
  }

  // Not open yet today, or already closed
  if (currentTime < openTime) {
    return {
      isOpen: false,
      nextOpenTime: `Hoje às ${todayHours.openTime}`,
    };
  }

  // Already closed today, find next opening
  const nextOpenTime = findNextOpenTime(operatingHours, now);
  return {
    isOpen: false,
    nextOpenTime,
  };
}

/**
 * Find the next opening time starting from the given date
 */
function findNextOpenTime(
  operatingHours: OperatingHours[],
  from: Date
): string {
  const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  
  // Check next 7 days
  for (let i = 1; i <= 7; i++) {
    const nextDate = new Date(from);
    nextDate.setDate(nextDate.getDate() + i);
    const nextDay = nextDate.getDay();
    
    const nextDayHours = operatingHours.find(h => h.dayOfWeek === nextDay);
    
    if (nextDayHours && !nextDayHours.isClosed) {
      const dayName = i === 1 ? 'Amanhã' : daysOfWeek[nextDay];
      return `${dayName} às ${nextDayHours.openTime}`;
    }
  }
  
  return 'Em breve';
}

/**
 * Get a human-readable status message
 */
export function getRestaurantStatusMessage(status: RestaurantStatusResult): string {
  if (status.isOpen) {
    return status.closesAt ? `Aberto até ${status.closesAt}` : 'Aberto';
  }
  
  return status.nextOpenTime ? `Abre ${status.nextOpenTime}` : 'Fechado';
}
