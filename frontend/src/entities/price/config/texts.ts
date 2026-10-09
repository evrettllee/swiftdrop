// The lines of a price block: the order form and the payment block of an order.
export const PRICE_TEXTS = {
  DISTANCE: 'Расстояние',
  TRAVEL_TIME: 'Время в пути',
  DELIVERY: 'Доставка',
  TOTAL: 'Итого',
  surcharge: (coefficient: string) => `Повышенный спрос ×${coefficient}`,
  extra: (amount: string) => `+${amount}`,
  distance: (km: string) => `${km} км`,
  travelTime: (minutes: number) => `≈ ${minutes} мин`,
} as const;
