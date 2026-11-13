import { hash } from '@node-rs/argon2';
import { and, eq, isNull } from 'drizzle-orm';
import { SINGLE_ROW_LIMIT } from '@/common/constants/database.constants';
import type { RoleName } from '@/common/enums/role.enum';
import type { Database, Transaction } from './database.module';
import * as schema from './schema';

export type SeedStaffAccount = {
  role: RoleName;
  label: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

export async function seedStaff(
  db: Database,
  account: SeedStaffAccount,
  afterCreate: (tx: Transaction, userId: number) => Promise<void> = () => Promise.resolve(),
): Promise<void> {
  const [role] = await db
    .select({ roleId: schema.roles.roleId })
    .from(schema.roles)
    .where(eq(schema.roles.name, account.role));
  if (!role) {
    throw new Error(`Role "${account.role}" not found`);
  }

  const existing = await db
    .select({ userId: schema.users.userId })
    .from(schema.users)
    .where(and(eq(schema.users.email, account.email), isNull(schema.users.deletedAt)))
    .limit(SINGLE_ROW_LIMIT);
  if (existing.length > 0) {
    console.log(`${account.label}: already exists`);
    return;
  }

  const passwordHash = await hash(account.password);

  await db.transaction(async (tx) => {
    const [user] = await tx
      .insert(schema.users)
      .values({
        roleId: role.roleId,
        firstName: account.firstName,
        lastName: account.lastName,
        email: account.email,
        passwordHash,
        emailVerifiedAt: new Date(),
      })
      .returning({ userId: schema.users.userId });

    await afterCreate(tx, user.userId);
  });

  console.log(`${account.label}: created (${account.email})`);
}
