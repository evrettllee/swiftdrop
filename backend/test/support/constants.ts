export const TEST_DB_NAME_SUFFIX = '_test';
export const TEST_DATABASE_ENV_NAME = 'TEST_DATABASE_URL';
export const ENV_FILE_PATH = '../.env';
export const MIGRATIONS_FOLDER = './drizzle';
export const CLIENT_IP_HEADER = 'X-Forwarded-For';
export const TEST_IP_PREFIX = '192.0.2.';

// Service area: a rectangle around central Minsk, rates chosen for easy hand calculation.
export const TEST_TARIFF = {
  name: 'Test tariff',
  pricePerKm: '1.00',
  pricePerKg: '0.50',
  minPrice: '5.00',
  fragileFee: '2.00',
};
export const TEST_ZONE_NAME = 'Test zone';
export const TEST_ZONE_POLYGON = [
  [
    [27.4, 53.85],
    [27.7, 53.85],
    [27.7, 53.95],
    [27.4, 53.95],
    [27.4, 53.85],
  ],
];
