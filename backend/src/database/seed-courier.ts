import { hash } from '@node-rs/argon2';
import { and, eq, isNull } from 'drizzle-orm';
import { SINGLE_ROW_LIMIT } from '../common/constants/database.constants';
import { ROLE } from '../common/enums/role.enum';
import type { Database } from './database.module';
import * as schema from './schema';
import { COURIER_FIRST_NAME, COURIER_LAST_NAME } from './seed.constants';

// A courier for trying the cabinet by hand: employees are created by the admin later.
// Safe to repeat: an existing account is left as it is.
export async function seedCourier(db: Database, email: string, password: string): Promise<void> {
  const [courierRole] = await db
    .select({ roleId: schema.roles.roleId })
    .from(schema.roles)
    .where(eq(schema.roles.name, ROLE.COURIER));
  if (!courierRole) {
    throw new Error(`Role "${ROLE.COURIER}" not found`);
  }

  const existing = await db
    .select({ userId: schema.users.userId })
    .from(schema.users)
    .where(and(eq(schema.users.email, email), isNull(schema.users.deletedAt)))
    .limit(SINGLE_ROW_LIMIT);
  if (existing.length > 0) {
    console.log('Courier: already exists');
    return;
  }

  const passwordHash = await hash(password);

  await db.transaction(async (tx) => {
    const [user] = await tx
      .insert(schema.users)
      .values({
        roleId: courierRole.roleId,
        firstName: COURIER_FIRST_NAME,
        lastName: COURIER_LAST_NAME,
        email,
        passwordHash,
        emailVerifiedAt: new Date(),
      })
      .returning({ userId: schema.users.userId });

    await tx.insert(schema.courierProfiles).values({ userId: user.userId });
  });

  console.log(`Courier: created (${email})`);
}
