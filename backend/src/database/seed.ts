import { existsSync } from 'node:fs';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { ENV_FILE_PATH, ENV_KEYS } from '@/config/env.constants';
import { DB_CASING } from './database.constants';
import * as schema from './schema';
import { seedCourier } from './seed-courier';
import { seedAdmin, seedRoles, seedTariff, seedZone } from './seed-steps';
import { SEED_ENV_KEYS } from './seed.constants';

if (existsSync(ENV_FILE_PATH)) {
  process.loadEnvFile(ENV_FILE_PATH);
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function main() {
  const databaseUrl = requireEnv(ENV_KEYS.DATABASE_URL);
  const adminEmail = normalizeEmail(requireEnv(SEED_ENV_KEYS.ADMIN_EMAIL));
  const adminPassword = requireEnv(SEED_ENV_KEYS.ADMIN_PASSWORD);
  const courierEmail = process.env[SEED_ENV_KEYS.COURIER_EMAIL];
  const courierPassword = process.env[SEED_ENV_KEYS.COURIER_PASSWORD];

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle({ client: pool, schema, casing: DB_CASING });

  try {
    await seedRoles(db);
    console.log('Roles: ok');

    const tariffId = await seedTariff(db);
    await seedZone(db, tariffId);
    await seedAdmin(db, adminEmail, adminPassword);

    if (courierEmail && courierPassword) {
      await seedCourier(db, normalizeEmail(courierEmail), courierPassword);
    } else {
      console.log('Courier: skipped, SEED_COURIER_EMAIL and SEED_COURIER_PASSWORD are not set');
    }
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
