import { type ConflictException, NotFoundException } from '@nestjs/common';
import { ORDER_STATUS, ORDER_STATUS_VALUES } from '@/common/enums/order-status.enum';
import {
  FAKE_COURIER_ROW,
  fakeAssignment,
  fakeOrderRow,
  insertCalls,
  setCalls,
} from '@test/support/manager-assignment-fakes';
import { ManagerOrderReassignmentService } from './manager-order-reassignment.service';

const ORDER = fakeOrderRow(ORDER_STATUS.COURIER_ASSIGNED, 5);
const CHANGED = {
  orderId: 42,
  status: ORDER_STATUS.COURIER_ASSIGNED,
  estimatedDeliveryAt: null,
  statusChangedAt: new Date('2026-10-30T09:00:00Z'),
  courierId: 3,
};
const REQUEST = {
  managerUserId: 7,
  orderId: 42,
  courierId: 3,
  expectedCourierId: 5,
  reason: 'Курьер попал в пробку',
  now: new Date(),
};
const SUCCESS = [[ORDER], [{ offerId: 6, courierId: 3 }], [FAKE_COURIER_ROW], [CHANGED], []];

function setUp(results: unknown[][], failure?: Error) {
  const fakes = fakeAssignment(results, failure);
  const service = new ManagerOrderReassignmentService(fakes.locks, fakes.notifierService);

  return { ...fakes, service };
}

const rejection = async (promise: Promise<unknown>) =>
  (await promise.catch((caught: unknown) => caught)) as ConflictException;

describe('ManagerOrderReassignmentService', () => {
  it('should move the order to the new courier and tell both couriers after the commit', async () => {
    const { service, log } = setUp(SUCCESS);

    await expect(service.reassign(REQUEST)).resolves.toEqual({ orderId: 42, courierId: 3 });

    expect(log).toEqual([
      'lock courier',
      'commit',
      'offer:closed 6',
      'order:unassigned 42 from 5',
      'order:assigned 42 to 3',
    ]);
  });

  it('should change only the courier and write the reason to the history', async () => {
    const { service, fake, orderTxs } = setUp(SUCCESS);

    await service.reassign(REQUEST);

    expect(setCalls(fake)).toEqual([{ status: 'revoked' }, { courierId: 3 }]);
    expect(insertCalls(fake)).toEqual([
      { orderId: 42, status: 'courier_assigned', changedBy: 7, comment: 'Курьер попал в пробку' },
    ]);
    expect(orderTxs[0].statusChanges).toEqual([]);
    expect(orderTxs[0].courierChanges).toEqual([{ ...CHANGED, previousCourierId: 5 }]);
  });

  it('should answer 404 for a missing order and for an unknown courier', async () => {
    await expect(setUp([[]]).service.reassign(REQUEST)).rejects.toThrow(NotFoundException);
    await expect(setUp([[ORDER], [], []]).service.reassign(REQUEST)).rejects.toThrow(
      NotFoundException,
    );
  });

  it.each(ORDER_STATUS_VALUES.filter((status) => status !== ORDER_STATUS.COURIER_ASSIGNED))(
    'should refuse an order in %s with ORDER_NOT_REASSIGNABLE',
    async (status) => {
      const { service, notifier } = setUp([[fakeOrderRow(status, 5)]]);

      const error = await rejection(service.reassign(REQUEST));

      expect(error.getResponse()).toMatchObject({
        statusCode: 409,
        code: 'ORDER_NOT_REASSIGNABLE',
      });
      expect(notifier.assigned).not.toHaveBeenCalled();
    },
  );

  it('should refuse with COURIER_CHANGED and the current courier when another manager changed it', async () => {
    const { service, fake, notifier } = setUp([[fakeOrderRow(ORDER_STATUS.COURIER_ASSIGNED, 8)]]);

    const error = await rejection(service.reassign(REQUEST));

    expect(error.getResponse()).toMatchObject({
      statusCode: 409,
      code: 'COURIER_CHANGED',
      currentCourierId: 8,
    });
    expect(setCalls(fake)).toEqual([]);
    expect(notifier.assigned).not.toHaveBeenCalled();
  });

  it('should refuse the courier the order already has with SAME_COURIER', async () => {
    const { service, fake } = setUp([[fakeOrderRow(ORDER_STATUS.COURIER_ASSIGNED, 3)]]);

    const error = await rejection(service.reassign({ ...REQUEST, expectedCourierId: 3 }));

    expect(error.getResponse()).toMatchObject({ statusCode: 409, code: 'SAME_COURIER' });
    expect(setCalls(fake)).toEqual([]);
  });

  it.each([
    [{ onShift: false }, 'offline'],
    [{ free: false }, 'busy'],
    [{ vehicleFits: false }, 'vehicle_mismatch'],
  ])('should refuse a new courier with %j as COURIER_NOT_AVAILABLE %s', async (failed, reason) => {
    const { service, notifier } = setUp([[ORDER], [], [{ ...FAKE_COURIER_ROW, ...failed }]]);

    const error = await rejection(service.reassign(REQUEST));

    expect(error.getResponse()).toMatchObject({ code: 'COURIER_NOT_AVAILABLE', reason });
    expect(notifier.unassigned).not.toHaveBeenCalled();
  });

  it('should send nothing when the transaction rolls back', async () => {
    const { service, notifier, log } = setUp(SUCCESS, new Error('rolled back'));

    await expect(service.reassign(REQUEST)).rejects.toThrow('rolled back');

    expect(log).toEqual(['lock courier']);
    expect(notifier.withdraw).not.toHaveBeenCalled();
    expect(notifier.unassigned).not.toHaveBeenCalled();
    expect(notifier.assigned).not.toHaveBeenCalled();
  });

  it('should answer busy when the order left its status under the lock', async () => {
    const { service } = setUp([[ORDER], [], [FAKE_COURIER_ROW], []]);

    const error = await rejection(service.reassign(REQUEST));

    expect(error.getResponse()).toMatchObject({ code: 'COURIER_NOT_AVAILABLE', reason: 'busy' });
  });
});
