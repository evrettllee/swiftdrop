import { existsSync } from 'node:fs';
import { hash } from '@node-rs/argon2';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { SINGLE_ROW_LIMIT } from '../common/constants/database';
import { ROLE, ROLE_NAMES } from '../common/enums/role.enum';
import { ENV_FILE_PATH, ENV_KEYS } from '../config/env.constants';
import { DB_CASING } from '../database/database.constants';
import * as schema from './schema';

if (existsSync(ENV_FILE_PATH)) {
  process.loadEnvFile(ENV_FILE_PATH);
}

const DEFAULT_TARIFF = {
  name: 'Стандартный',
  pricePerKm: '1.00',
  pricePerKg: '0.50',
  minPrice: '5.00',
  fragileFee: '2.00',
};

const DEFAULT_ZONE_NAME = 'Минск';

// Rough outline of Minsk as [longitude, latitude] points, GeoJSON order, ring is closed.
// A manager replaces it with real zones drawn on the map later.
const DEFAULT_ZONE_POLYGON: number[][][] = [
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

const ADMIN_FIRST_NAME = 'Администратор';
const ADMIN_LAST_NAME = 'SwiftDrop';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

async function main() {
  const databaseUrl = requireEnv(ENV_KEYS.DATABASE_URL);
  const adminEmail = requireEnv('SEED_ADMIN_EMAIL').trim().toLowerCase();
  const adminPassword = requireEnv('SEED_ADMIN_PASSWORD');

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle({ client: pool, schema, casing: DB_CASING });

  try {
    await db
      .insert(schema.roles)
      .values(ROLE_NAMES.map((name) => ({ name })))
      .onConflictDoNothing();
    console.log('Roles: ok');

    const [existingTariff] = await db
      .select({ tariffId: schema.tariffs.tariffId })
      .from(schema.tariffs)
      .orderBy(asc(schema.tariffs.tariffId))
      .limit(SINGLE_ROW_LIMIT);

    let tariffId: number;
    if (existingTariff) {
      tariffId = existingTariff.tariffId;
      console.log('Tariff: already exists');
    } else {
      const [createdTariff] = await db
        .insert(schema.tariffs)
        .values(DEFAULT_TARIFF)
        .returning({ tariffId: schema.tariffs.tariffId });
      if (!createdTariff) {
        throw new Error('Tariff was not created');
      }
      tariffId = createdTariff.tariffId;
      console.log('Tariff: created');
    }

    const existingZones = await db
      .select({ zoneId: schema.serviceZones.zoneId })
      .from(schema.serviceZones)
      .limit(SINGLE_ROW_LIMIT);
    if (existingZones.length === 0) {
      await db.insert(schema.serviceZones).values({
        name: DEFAULT_ZONE_NAME,
        polygon: DEFAULT_ZONE_POLYGON,
        tariffId,
      });
      console.log('Zone: created');
    } else {
      console.log('Zone: already exists');
    }

    const [adminRole] = await db
      .select({ roleId: schema.roles.roleId })
      .from(schema.roles)
      .where(eq(schema.roles.name, ROLE.ADMIN));
    if (!adminRole) {
      throw new Error(`Role "${ROLE.ADMIN}" not found`);
    }

    const existingAdmin = await db
      .select({ userId: schema.users.userId })
      .from(schema.users)
      .where(and(eq(schema.users.email, adminEmail), isNull(schema.users.deletedAt)))
      .limit(SINGLE_ROW_LIMIT);
    if (existingAdmin.length === 0) {
      await db.insert(schema.users).values({
        roleId: adminRole.roleId,
        firstName: ADMIN_FIRST_NAME,
        lastName: ADMIN_LAST_NAME,
        email: adminEmail,
        passwordHash: await hash(adminPassword),
        emailVerifiedAt: new Date(),
      });
      console.log(`Admin: created (${adminEmail})`);
    } else {
      console.log('Admin: already exists');
    }
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
