import { existsSync } from 'node:fs';
import { hash } from '@node-rs/argon2';
import { and, eq, isNull } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { ROLE, ROLE_NAMES } from '../common/enums/role.enum';
import * as schema from './schema';

if (existsSync('../.env')) {
  process.loadEnvFile('../.env');
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

async function main() {
  const databaseUrl = requireEnv('DATABASE_URL');
  const adminEmail = requireEnv('SEED_ADMIN_EMAIL').trim().toLowerCase();
  const adminPassword = requireEnv('SEED_ADMIN_PASSWORD');

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle({ client: pool, schema, casing: 'snake_case' });

  try {
    await db
      .insert(schema.roles)
      .values(ROLE_NAMES.map((name) => ({ name })))
      .onConflictDoNothing();
    console.log('Roles: ok');

    const existingTariffs = await db
      .select({ tariffId: schema.tariffs.tariffId })
      .from(schema.tariffs)
      .limit(1);
    if (existingTariffs.length === 0) {
      await db.insert(schema.tariffs).values({
        name: 'Стандартный',
        pricePerKm: '1.00',
        pricePerKg: '0.50',
        minPrice: '5.00',
        fragileFee: '2.00',
      });
      console.log('Tariff: created');
    } else {
      console.log('Tariff: already exists');
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
      .limit(1);
    if (existingAdmin.length === 0) {
      await db.insert(schema.users).values({
        roleId: adminRole.roleId,
        firstName: 'Администратор',
        lastName: 'SwiftDrop',
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
