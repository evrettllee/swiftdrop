import { eq, sql } from 'drizzle-orm';
import { ROW_LOCK_NO_KEY_UPDATE } from '../../src/common/constants/database.constants';
import type { Database, Transaction } from '../../src/database/database.module';
import { orderOffers, orders } from '../../src/database/schema';

export type HoldRows = (tx: Transaction) => Promise<unknown>;

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

// How often and how long to look for the action waiting: well inside the lock timeout of the app.
const BLOCKED_CHECK_INTERVAL_MS = 10;
const BLOCKED_CHECK_ATTEMPTS = 200;

// Resolves once a session of the app waits for a lock that the given backend holds.
async function waitUntilBlockedBy(db: Database, holderPid: number): Promise<void> {
  for (let attempt = 0; attempt < BLOCKED_CHECK_ATTEMPTS; attempt += 1) {
    const { rows } = await db.execute<{ waiting: number }>(
      sql`select count(*)::int as waiting from pg_stat_activity
          where ${holderPid} = any(pg_blocking_pids(pid))`,
    );

    if (rows[0].waiting > 0) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, BLOCKED_CHECK_INTERVAL_MS));
  }

  throw new Error(`Nothing waited for the locks of backend ${holderPid}`);
}

// Does `hold` in a transaction, starts `action`, and commits only once the action waits for what
// the transaction holds: the order of the two is fixed, not left to timing. `beforeCommit` runs
// while the action still waits, for example to close its socket.
export async function commitOnceBlocked<T>(
  db: Database,
  hold: HoldRows,
  action: () => PromiseLike<T>,
  beforeCommit: () => Promise<void> = () => Promise.resolve(),
): Promise<T> {
  const holding = Promise.withResolvers<number>();
  const release = Promise.withResolvers<void>();
  const holder = db.transaction(async (tx) => {
    await hold(tx);
    const { rows } = await tx.execute<{ pid: number }>(sql`select pg_backend_pid() as pid`);
    holding.resolve(rows[0].pid);
    await release.promise;
  });
  const holderPid = await holding.promise;
  const pending = Promise.resolve(action());

  try {
    await waitUntilBlockedBy(db, holderPid);
    await beforeCommit();
  } finally {
    release.resolve();
    await holder;
  }

  return pending;
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
