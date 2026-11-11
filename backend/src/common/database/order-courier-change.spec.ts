import type { SQL } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import type { Database, Transaction } from '@/database/database.module';
import * as schema from '@/database/schema';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { changeOrderCourier, runOrderTransaction } from './order-status-transition';

const CHANGED_AT = new Date('2026-10-30T10:00:00Z');
const UPDATED = {
  orderId: 7,
  status: ORDER_STATUS.COURIER_ASSIGNED,
  estimatedDeliveryAt: null,
  statusChangedAt: CHANGED_AT,
  courierId: 4,
};
const CHANGE = {
  orderId: 7,
  from: [ORDER_STATUS.COURIER_ASSIGNED],
  courierId: 4,
  previousCourierId: 9,
  changedBy: 2,
  comment: 'Курьер попал в пробку',
};

function fakeTransaction(rows: (typeof UPDATED)[]) {
  const sets: Record<string, unknown>[] = [];
  const inserts: Record<string, unknown>[] = [];
  const where: SQL[] = [];
  const tx = {
    update: () => ({
      set: (values: Record<string, unknown>) => {
        sets.push(values);

        return {
          where: (condition: SQL) => {
            where.push(condition);

            return { returning: () => Promise.resolve(rows) };
          },
        };
      },
    }),
    insert: () => ({
      values: (values: Record<string, unknown>) => {
        inserts.push(values);

        return Promise.resolve();
      },
    }),
  } as unknown as Transaction;

  return { tx, sets, inserts, where };
}

describe('changeOrderCourier', () => {
  it('should change only the courier and keep the status and its time', async () => {
    const fake = fakeTransaction([UPDATED]);
    const orderTx = { tx: fake.tx, statusChanges: [], courierChanges: [] };

    await expect(changeOrderCourier(orderTx, CHANGE)).resolves.toEqual({ orderId: 7 });
    expect(fake.sets).toEqual([{ courierId: 4 }]);
    expect(orderTx.statusChanges).toEqual([]);
    expect(orderTx.courierChanges).toEqual([{ ...UPDATED, previousCourierId: 9 }]);
  });

  it('should write a history row with the same status, the manager and the reason', async () => {
    const fake = fakeTransaction([UPDATED]);

    await changeOrderCourier({ tx: fake.tx, statusChanges: [], courierChanges: [] }, CHANGE);

    expect(fake.inserts).toEqual([
      {
        orderId: 7,
        status: ORDER_STATUS.COURIER_ASSIGNED,
        changedBy: 2,
        comment: 'Курьер попал в пробку',
      },
    ]);
  });

  it('should check the status in the update itself', async () => {
    const fake = fakeTransaction([UPDATED]);
    const db = drizzle.mock({ schema, casing: 'snake_case' }) as unknown as Database;

    await changeOrderCourier({ tx: fake.tx, statusChanges: [], courierChanges: [] }, CHANGE);
    const { sql } = db.update(schema.orders).set({ courierId: 4 }).where(fake.where[0]).toSQL();

    expect(sql).toContain('"orders"."status" in ($');
  });

  it('should write nothing when the order left the status', async () => {
    const fake = fakeTransaction([]);
    const orderTx = { tx: fake.tx, statusChanges: [], courierChanges: [] };

    await expect(changeOrderCourier(orderTx, CHANGE)).resolves.toBeUndefined();
    expect(fake.inserts).toEqual([]);
    expect(orderTx.courierChanges).toEqual([]);
  });

  it('should publish the courier change apart from the status changes after the commit', async () => {
    const fake = fakeTransaction([UPDATED]);
    const publish = jest.fn();
    const db = {
      transaction: <T>(work: (tx: Transaction) => Promise<T>) => work(fake.tx),
    } as unknown as Database;

    await runOrderTransaction(db, (orderTx) => changeOrderCourier(orderTx, CHANGE), publish);

    expect(publish).toHaveBeenCalledWith([], [{ ...UPDATED, previousCourierId: 9 }]);
  });
});
