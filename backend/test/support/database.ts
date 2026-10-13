import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { ROLE_NAMES } from '../../src/common/enums/role.enum';
import { DB_CASING } from '../../src/database/database.constants';
import type { Database } from '../../src/database/database.module';
import * as schema from '../../src/database/schema';
import {
  MIGRATIONS_FOLDER,
  TEST_DB_NAME_SUFFIX,
  TEST_TARIFF,
  TEST_ZONE_NAME,
  TEST_ZONE_POLYGON,
} from './constants';

export async function prepareTestDatabase(): Promise<void> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle({ client: pool, schema, casing: DB_CASING });

  try {
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
    await db
      .insert(schema.roles)
      .values(ROLE_NAMES.map((name) => ({ name })))
      .onConflictDoNothing();
  } finally {
    await pool.end();
  }
}

// Second line of defence: ask the database itself before deleting anything.
async function assertTestDatabase(db: Database): Promise<void> {
  const result = await db.execute<{ name: string }>(sql`SELECT current_database() AS name`);
  const name = result.rows[0]?.name;

  if (!name?.endsWith(TEST_DB_NAME_SUFFIX)) {
    throw new Error(`Refusing to reset data in database "${name}"`);
  }
}

export async function resetTestData(db: Database): Promise<void> {
  await assertTestDatabase(db);
  await db.execute(sql`TRUNCATE TABLE users, tariffs, service_zones RESTART IDENTITY CASCADE`);
}

// One active tariff and one active zone that covers the central Minsk test points.
export async function seedServiceArea(db: Database): Promise<void> {
  const [tariff] = await db
    .insert(schema.tariffs)
    .values(TEST_TARIFF)
    .returning({ tariffId: schema.tariffs.tariffId });

  await db.insert(schema.serviceZones).values({
    name: TEST_ZONE_NAME,
    polygon: TEST_ZONE_POLYGON,
    tariffId: tariff.tariffId,
  });
}
