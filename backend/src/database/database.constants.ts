export const PG_POOL = Symbol('PG_POOL');
export const DRIZZLE = Symbol('DRIZZLE');

// The schema uses camelCase keys for snake_case columns: the app, the seed and drizzle-kit must agree.
export const DB_CASING = 'snake_case';
