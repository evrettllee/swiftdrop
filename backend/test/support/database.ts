import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { ROLE_NAMES } from '../../src/common/enums/role.enum';
import type { Database } from '../../src/database/database.module';
import * as schema from '../../src/db/schema';
import { MIGRATIONS_FOLDER, TEST_DB_NAME_SUFFIX } from './constants';

export async function prepareTestDatabase(): Promise<void> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle({ client: pool, schema, casing: 'snake_case' });

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
  await db.execute(sql`TRUNCATE TABLE users RESTART IDENTITY CASCADE`);
}
