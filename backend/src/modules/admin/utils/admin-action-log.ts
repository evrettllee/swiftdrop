import { ADMIN_ACTION } from '@/common/enums/admin-action.enum';
import type { Transaction } from '@/database/database.module';
import { adminActions } from '@/database/schema';
import type { AdminActionDetails } from '../schemas/admin-action-details.schema';

type TariffAction =
  | typeof ADMIN_ACTION.TARIFF_CREATED
  | typeof ADMIN_ACTION.TARIFF_UPDATED
  | typeof ADMIN_ACTION.TARIFF_ENABLED
  | typeof ADMIN_ACTION.TARIFF_DISABLED;

type UserAction = Exclude<keyof AdminActionDetails, TariffAction>;

export type UserActionEntry = {
  [K in UserAction]: {
    actorId: number;
    targetUserId: number;
    action: K;
    details: AdminActionDetails[K];
  };
}[UserAction];

export type TariffActionEntry = {
  [K in TariffAction]: {
    actorId: number;
    tariffId: number;
    action: K;
    details: AdminActionDetails[K];
  };
}[TariffAction];

export async function recordUserAction(tx: Transaction, entry: UserActionEntry): Promise<void> {
  await tx.insert(adminActions).values(entry);
}

export async function recordTariffAction(tx: Transaction, entry: TariffActionEntry): Promise<void> {
  await tx.insert(adminActions).values(entry);
}
