import { eq } from 'drizzle-orm';
import { ROW_LOCK_NO_KEY_UPDATE } from '../../src/common/constants/database.constants';
import type { Database, Transaction } from '../../src/database/database.module';
import { orderOffers, orders } from '../../src/database/schema';

type HoldRows = (tx: Transaction) => Promise<unknown>;

// Runs `action` while another transaction holds the rows `hold` locks, as an operation that is
// still talking to an outside service (a payment start, a refund) does.
export async function whileRowsAreHeld<T>(
  db: Database,
  hold: HoldRows,
  action: () => Promise<T>,
): Promise<T> {
  const lockTaken = Promise.withResolvers<void>();
  const release = Promise.withResolvers<void>();
  const holder = db.transaction(async (tx) => {
    await hold(tx);
    lockTaken.resolve();
    await release.promise;
  });

  await lockTaken.promise;

  try {
    return await action();
  } finally {
    release.resolve();
    await holder;
  }
}

export function holdOrder(orderId: number): HoldRows {
  return (tx) =>
    tx.select().from(orders).where(eq(orders.orderId, orderId)).for(ROW_LOCK_NO_KEY_UPDATE);
}

export function holdOffer(offerId: number): HoldRows {
  return (tx) =>
    tx
      .select()
      .from(orderOffers)
      .where(eq(orderOffers.offerId, offerId))
      .for(ROW_LOCK_NO_KEY_UPDATE);
}
