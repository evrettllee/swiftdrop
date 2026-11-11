import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { VEHICLE_TYPE } from '@/common/enums/vehicle-type.enum';
import { DB_CASING } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import * as schema from '@/database/schema';
import { seedCourier } from '@/database/seed-courier';
import { seedRoles, seedTariff, seedZone } from '@/database/seed-steps';
import { prepareTestDatabase, resetTestData } from './database';
import { loadTestEnv } from './env';

const STAND_COURIER_EMAIL_ENV = 'E2E_COURIER_EMAIL';
const STAND_COURIER_PASSWORD_ENV = 'E2E_COURIER_PASSWORD';
const STAND_VEHICLE = {
  type: VEHICLE_TYPE.CAR,
  brand: 'Skoda',
  model: 'Octavia',
  licensePlate: '1234 AB-7',
};

async function seedCourierVehicle(db: Database, email: string): Promise<void> {
  const [courier] = await db
    .select({ courierProfileId: schema.courierProfiles.courierProfileId })
    .from(schema.courierProfiles)
    .innerJoin(schema.users, eq(schema.users.userId, schema.courierProfiles.userId))
    .where(eq(schema.users.email, email));

  if (courier === undefined) {
    throw new Error('The courier of the stand was not created');
  }

  await db.insert(schema.vehicles).values({ ...STAND_VEHICLE, ...courier });
}

function requireStandValue(name: string): string {
  const value = process.env[name];

  if (value === undefined || value === '') {
    throw new Error(`${name} is required to seed the e2e stand`);
  }

  return value;
}

export async function seedE2eStand(): Promise<void> {
  loadTestEnv();
  await prepareTestDatabase();

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle({ client: pool, schema, casing: DB_CASING });

  try {
    await resetTestData(db);
    await seedRoles(db);
    const tariffId = await seedTariff(db);
    await seedZone(db, tariffId);
    const email = requireStandValue(STAND_COURIER_EMAIL_ENV).trim().toLowerCase();
    await seedCourier(db, email, requireStandValue(STAND_COURIER_PASSWORD_ENV));
    await seedCourierVehicle(db, email);
  } finally {
    await pool.end();
  }
}
