import type { Database, Transaction } from '@/database/database.module';
import { ORDER_STATUS, type OrderStatus } from '@/common/enums/order-status.enum';
import {
  type OrderStatusChange,
  runOrderTransaction,
  transitionOrderStatus,
} from './order-status-transition';

const ETA = new Date('2026-10-22T12:30:00Z');

// A transaction whose UPDATE answers with the order in the status it was moved to, and a database
// whose transaction commits or rolls back as the work ends; the calls are recorded in order.
function fakeDatabase(calls: string[]): Database {
  const tx = {
    update: () => ({
      set: ({ status }: { status: OrderStatus }) => ({
        where: () => ({
          returning: () => {
            calls.push(`update ${status}`);
            return Promise.resolve([{ orderId: 1, status, estimatedDeliveryAt: ETA }]);
          },
        }),
      }),
    }),
    insert: () => ({ values: () => Promise.resolve() }),
  } as unknown as Transaction;

  return {
    transaction: async <T>(work: (handle: Transaction) => Promise<T>): Promise<T> => {
      const result = await work(tx);
      calls.push('commit');
      return result;
    },
  } as unknown as Database;
}

describe('runOrderTransaction', () => {
  it('should publish the status change after the commit', async () => {
    const calls: string[] = [];
    const publish = jest.fn((changes: readonly OrderStatusChange[]) => {
      calls.push(`publish ${changes.length}`);
    });

    await runOrderTransaction(
      fakeDatabase(calls),
      (orderTx) =>
        transitionOrderStatus(orderTx, {
          orderId: 1,
          from: ORDER_STATUS.PENDING,
          to: ORDER_STATUS.CONFIRMED,
          changedBy: null,
        }),
      publish,
    );

    expect(calls).toEqual(['update confirmed', 'commit', 'publish 1']);
    expect(publish).toHaveBeenCalledWith([
      { orderId: 1, status: ORDER_STATUS.CONFIRMED, estimatedDeliveryAt: ETA },
    ]);
  });

  it('should publish nothing when the transaction rolls back', async () => {
    const calls: string[] = [];
    const publish = jest.fn();
    const failure = new Error('rolled back');

    const run = runOrderTransaction(
      fakeDatabase(calls),
      async (orderTx) => {
        await transitionOrderStatus(orderTx, {
          orderId: 1,
          from: ORDER_STATUS.CONFIRMED,
          to: ORDER_STATUS.COURIER_ASSIGNED,
          changedBy: 2,
        });
        throw failure;
      },
      publish,
    );

    await expect(run).rejects.toBe(failure);
    expect(calls).toEqual(['update courier_assigned']);
    expect(publish).not.toHaveBeenCalled();
  });

  it('should publish several changes of one transaction in the order they were made', async () => {
    const publish = jest.fn();
    const steps: OrderStatus[] = [ORDER_STATUS.PICKED_UP, ORDER_STATUS.IN_TRANSIT];

    await runOrderTransaction(
      fakeDatabase([]),
      async (orderTx) => {
        for (const to of steps) {
          await transitionOrderStatus(orderTx, { orderId: 1, from: [], to, changedBy: 2 });
        }
      },
      publish,
    );

    expect(publish).toHaveBeenCalledTimes(1);
    expect(publish.mock.calls[0][0].map((change: OrderStatusChange) => change.status)).toEqual(
      steps,
    );
  });

  it('should publish an empty list when nothing changed', async () => {
    const publish = jest.fn();

    await runOrderTransaction(fakeDatabase([]), () => Promise.resolve(), publish);

    expect(publish).toHaveBeenCalledWith([]);
  });
});

describe('transitionOrderStatus finish time', () => {
  function recordingTransaction(sets: Record<string, unknown>[]) {
    const tx = {
      update: () => ({
        set: (values: Record<string, unknown>) => {
          sets.push(values);

          return {
            where: () => ({
              returning: () =>
                Promise.resolve([{ orderId: 1, status: values.status, estimatedDeliveryAt: null }]),
            }),
          };
        },
      }),
      insert: () => ({ values: () => Promise.resolve() }),
    } as unknown as Transaction;

    return { tx, statusChanges: [] };
  }

  it.each([ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED, ORDER_STATUS.REJECTED])(
    'should stamp the finish time when the order becomes %s',
    async (to) => {
      const sets: Record<string, unknown>[] = [];

      await transitionOrderStatus(recordingTransaction(sets), {
        orderId: 1,
        from: [],
        to,
        changedBy: null,
      });

      expect(sets[0]).toHaveProperty('finishedAt');
      expect(sets[0].status).toBe(to);
    },
  );

  it.each([ORDER_STATUS.CONFIRMED, ORDER_STATUS.COURIER_ASSIGNED, ORDER_STATUS.IN_TRANSIT])(
    'should leave the finish time alone when the order becomes %s',
    async (to) => {
      const sets: Record<string, unknown>[] = [];

      await transitionOrderStatus(recordingTransaction(sets), {
        orderId: 1,
        from: [],
        to,
        changedBy: null,
      });

      expect(sets[0]).not.toHaveProperty('finishedAt');
    },
  );
});
