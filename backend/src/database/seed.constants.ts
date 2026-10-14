// Variables the seed reads besides the ones of the app. The courier ones are optional.
export const SEED_ENV_KEYS = {
  ADMIN_EMAIL: 'SEED_ADMIN_EMAIL',
  ADMIN_PASSWORD: 'SEED_ADMIN_PASSWORD',
  COURIER_EMAIL: 'SEED_COURIER_EMAIL',
  COURIER_PASSWORD: 'SEED_COURIER_PASSWORD',
} as const;

export const DEFAULT_TARIFF = {
  name: 'Стандартный',
  pricePerKm: '1.00',
  pricePerKg: '0.50',
  minPrice: '5.00',
  fragileFee: '2.00',
};

export const DEFAULT_ZONE_NAME = 'Минск';

// Rough outline of Minsk as [longitude, latitude] points, GeoJSON order, ring is closed.
// A manager replaces it with real zones drawn on the map later.
export const DEFAULT_ZONE_POLYGON: number[][][] = [
  [
    [27.4, 53.93],
    [27.43, 53.97],
    [27.52, 53.985],
    [27.62, 53.98],
    [27.7, 53.95],
    [27.75, 53.9],
    [27.74, 53.85],
    [27.66, 53.82],
    [27.54, 53.815],
    [27.45, 53.84],
    [27.4, 53.88],
    [27.4, 53.93],
  ],
];

export const ADMIN_FIRST_NAME = 'Администратор';
export const ADMIN_LAST_NAME = 'SwiftDrop';

export const COURIER_FIRST_NAME = 'Дмитрий';
export const COURIER_LAST_NAME = 'Соколов';
