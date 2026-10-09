export const PG_POOL = Symbol('PG_POOL');
export const DRIZZLE = Symbol('DRIZZLE');

// The schema uses camelCase keys for snake_case columns: the app, the seed and drizzle-kit must agree.
export const DB_CASING = 'snake_case';

// A statement that waits longer than this for a lock fails, so a lock held across a call to the
// payment system cannot stall a pool connection for good. Postgres sees no deadlock when one link
// of the wait goes through the application (a transaction waiting for another connection of the
// pool), so without the limit such a wait would never end.
export const DB_LOCK_TIMEOUT_MS = 5000;
// Session settings passed with every connection of the pool.
export const DB_CONNECTION_OPTIONS = `-c lock_timeout=${DB_LOCK_TIMEOUT_MS}`;
