export const TEST_DB_NAME_SUFFIX = '_test';
export const TEST_DATABASE_ENV_NAME = 'TEST_DATABASE_URL';
export const MIGRATIONS_FOLDER = './drizzle';
export const CLIENT_IP_HEADER = 'X-Forwarded-For';
export const TEST_IP_PREFIX = '192.0.2.';
export const CONTENT_TYPE_HEADER = 'Content-Type';
export const JSON_CONTENT_TYPE = 'application/json';
// The Express setting that lets tests set the client address through X-Forwarded-For.
export const TRUST_PROXY_SETTING = 'trust proxy';

// An id no order has.
export const MISSING_ORDER_ID = 999_999;
// Added to the lock timeout of the database in the tests that wait for it.
export const LOCK_TEST_MARGIN_MS = 10_000;

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

export const APP_HOOK_TIMEOUT_MS = 30_000;
