import { NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { ROW_LOCK_NO_KEY_UPDATE, SINGLE_ROW_LIMIT } from '@/common/constants/database.constants';
import type { Transaction } from '@/database/database.module';
import { roles, users } from '@/database/schema';
import { USER_NOT_FOUND_MESSAGE } from '../constants/admin-users.constants';
import { managedRole, USER_ROW_COLUMNS } from './admin-user-columns';

export async function lockTargetUser(tx: Transaction, userId: number) {
  const [row] = await tx
    .select(USER_ROW_COLUMNS)
    .from(users)
    .innerJoin(roles, eq(roles.roleId, users.roleId))
    .where(and(eq(users.userId, userId), managedRole))
    .limit(SINGLE_ROW_LIMIT)
    .for(ROW_LOCK_NO_KEY_UPDATE, { of: users });

  if (!row) {
    throw new NotFoundException(USER_NOT_FOUND_MESSAGE);
  }

  return row;
}

export type LockedTargetUser = Awaited<ReturnType<typeof lockTargetUser>>;
