import { UnauthorizedException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { ROW_LOCK_SHARE, SINGLE_ROW_LIMIT } from '@/common/constants/database.constants';
import type { Transaction } from '@/database/database.module';
import { users } from '@/database/schema';
import { AUTH_ERROR_MESSAGES } from '@/modules/auth/constants/access.constants';

export async function lockActiveUser(tx: Transaction, userId: number): Promise<void> {
  const [user] = await tx
    .select({ isBlocked: users.isBlocked, deletedAt: users.deletedAt })
    .from(users)
    .where(eq(users.userId, userId))
    .limit(SINGLE_ROW_LIMIT)
    .for(ROW_LOCK_SHARE);

  if (!user || user.isBlocked || user.deletedAt !== null) {
    throw new UnauthorizedException(AUTH_ERROR_MESSAGES.UNAUTHORIZED);
  }
}
