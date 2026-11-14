import type { Transaction } from '@/database/database.module';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { transitionOrderStatus } from './order-status-transition';

describe('transitionOrderStatus facts', () => {
  async function setOf(transition: Partial<Parameters<typeof transitionOrderStatus>[1]>) {
    let written: Record<string, unknown> = {};
    const tx = {
      update: () => ({
        set: (values: Record<string, unknown>) => {
          written = values;

          return {
            where: () => ({ returning: () => Promise.resolve([{ orderId: 1 }]) }),
          };
        },
      }),
      insert: () => ({ values: () => Promise.resolve() }),
    } as unknown as Transaction;

    await transitionOrderStatus(
      { tx, statusChanges: [], courierChanges: [] },
      {
        orderId: 1,
        from: ORDER_STATUS.PENDING,
        to: ORDER_STATUS.CONFIRMED,
        changedBy: null,
        ...transition,
      },
    );

    return Object.keys(written).filter((key) => key.endsWith('At') || key.endsWith('Auto'));
  }

  it('should keep the first payment time on every confirmation', async () => {
    expect(await setOf({})).toEqual(['paidAt', 'statusChangedAt']);
  });

  it('should write the first assignment only when the caller names its kind', async () => {
    const assigned = { from: ORDER_STATUS.CONFIRMED, to: ORDER_STATUS.COURIER_ASSIGNED };

    expect(await setOf({ ...assigned, firstAssignmentAuto: true })).toEqual([
      'firstAssignedAt',
      'firstAssignedAuto',
      'statusChangedAt',
    ]);
    expect(await setOf(assigned)).toEqual(['statusChangedAt']);
  });
});
