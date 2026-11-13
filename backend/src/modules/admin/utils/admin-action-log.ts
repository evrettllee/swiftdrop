import type { Transaction } from '@/database/database.module';
import { adminActions } from '@/database/schema';
import type { AdminActionDetails } from '../schemas/admin-action-details.schema';

export type UserActionEntry = {
  [K in keyof AdminActionDetails]: {
    actorId: number;
    targetUserId: number;
    action: K;
    details: AdminActionDetails[K];
  };
}[keyof AdminActionDetails];

export async function recordUserAction(tx: Transaction, entry: UserActionEntry): Promise<void> {
  await tx.insert(adminActions).values(entry);
}
