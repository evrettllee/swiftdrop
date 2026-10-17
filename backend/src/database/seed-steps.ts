import { hash } from '@node-rs/argon2';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { SINGLE_ROW_LIMIT } from '../common/constants/database.constants';
import { ROLE, ROLE_NAMES } from '../common/enums/role.enum';
import type { Database } from './database.module';
import * as schema from './schema';
import {
  ADMIN_FIRST_NAME,
  ADMIN_LAST_NAME,
  DEFAULT_TARIFF,
  DEFAULT_ZONE_NAME,
  DEFAULT_ZONE_POLYGON,
} from './seed.constants';

// Every step is safe to repeat: what already exists is left as it is.
export async function seedRoles(db: Database): Promise<void> {
  await db
    .insert(schema.roles)
    .values(ROLE_NAMES.map((name) => ({ name })))
    .onConflictDoNothing();
}

// Returns the oldest tariff, the default one is created when there is none.
export async function seedTariff(db: Database): Promise<number> {
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

  return tariffId;
}

export async function seedZone(db: Database, tariffId: number): Promise<void> {
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
}

export async function seedAdmin(
  db: Database,
  adminEmail: string,
  adminPassword: string,
): Promise<void> {
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
}
