import { type ConflictException, NotFoundException } from '@nestjs/common';
import {
  ORDER_STATUS,
  ORDER_STATUS_VALUES,
  type OrderStatus,
} from '@/common/enums/order-status.enum';
import type { OrderDispatchService } from '@/modules/assignment/services/order-dispatch.service';
import type { OrderEventsService } from '@/modules/tracking/services/order-events.service';
import {
  fakeAssignment,
  fakeOrderRow,
  insertCalls,
  setCalls,
} from '@test/support/manager-assignment-fakes';
import { ManagerAssignmentRestartService } from './manager-assignment-restart.service';

const CONFIRMED = {
  orderId: 42,
  status: ORDER_STATUS.CONFIRMED,
  estimatedDeliveryAt: null,
  statusChangedAt: new Date('2026-10-30T09:00:00Z'),
  courierId: null,
};
const REQUEST = {
  managerUserId: 7,
  orderId: 42,
  expectedCourierId: 5,
  reason: 'Курьер не отвечает',
};
const NO_COURIER = { ...REQUEST, expectedCourierId: null };
const RESTARTABLE: OrderStatus[] = [
  ORDER_STATUS.AWAITING_MANUAL_ASSIGNMENT,
  ORDER_STATUS.COURIER_ASSIGNED,
];

function setUp(results: unknown[][], failure?: Error) {
  const fakes = fakeAssignment(results, failure);
  const publishOrderCourier = jest.fn(
    (orderId: number, courierId: number | null, previous: number | null) =>
      fakes.log.push(`order:courier ${orderId} ${courierId} except ${previous}`),
  );
  const dispatch = jest.fn((orderId: number) => {
    fakes.log.push(`dispatch ${orderId}`);

    return Promise.resolve();
  });
  const service = new ManagerAssignmentRestartService(
    fakes.locks,
    fakes.notifierService,
    { publishOrderCourier } as unknown as OrderEventsService,
    { dispatch } as unknown as OrderDispatchService,
  );

  return { ...fakes, service, dispatch, publishOrderCourier };
}

const rejection = async (promise: Promise<unknown>) =>
  (await promise.catch((caught: unknown) => caught)) as ConflictException;

describe('ManagerAssignmentRestartService', () => {
  it('should take the order from its courier, open a new round and dispatch it after the commit', async () => {
    const { service, log, fake } = setUp([
      [fakeOrderRow(ORDER_STATUS.COURIER_ASSIGNED, 5, 2)],
      [],
      [CONFIRMED],
      [],
    ]);

    await expect(service.restart(REQUEST)).resolves.toEqual({ orderId: 42, status: 'confirmed' });

    expect(log).toEqual([
      'commit',
      'order:unassigned 42 from 5',
      'order:courier 42 null except 5',
      'dispatch 42',
    ]);
    expect(setCalls(fake)).toEqual([
      { status: 'revoked' },
      expect.objectContaining({ status: 'confirmed', courierId: null, assignmentRound: 3 }),
    ]);
    expect(insertCalls(fake)).toEqual([
      { orderId: 42, status: 'confirmed', changedBy: 7, comment: 'Курьер не отвечает' },
    ]);
  });

  it('should restart an order waiting for a manager without telling any courier', async () => {
    const { service, log, notifier, fake } = setUp([
      [fakeOrderRow(ORDER_STATUS.AWAITING_MANUAL_ASSIGNMENT)],
      [{ offerId: 8, courierId: 4 }],
      [CONFIRMED],
      [],
    ]);

    await service.restart({ ...NO_COURIER, reason: null });

    expect(log).toEqual(['commit', 'offer:closed 8', 'dispatch 42']);
    expect(notifier.unassigned).not.toHaveBeenCalled();
    expect(setCalls(fake)[1]).toMatchObject({ assignmentRound: 2 });
    expect(insertCalls(fake)).toEqual([
      { orderId: 42, status: 'confirmed', changedBy: 7, comment: null },
    ]);
  });

  it('should answer 404 for a missing order', async () => {
    await expect(setUp([[]]).service.restart(REQUEST)).rejects.toThrow(NotFoundException);
  });

  it.each(ORDER_STATUS_VALUES.filter((status) => !RESTARTABLE.includes(status)))(
    'should refuse an order in %s with ORDER_NOT_RESTARTABLE',
    async (status) => {
      const { service, dispatch } = setUp([[fakeOrderRow(status)]]);

      const error = await rejection(service.restart(REQUEST));

      expect(error.getResponse()).toMatchObject({ statusCode: 409, code: 'ORDER_NOT_RESTARTABLE' });
      expect(dispatch).not.toHaveBeenCalled();
    },
  );

  it.each([
    [ORDER_STATUS.COURIER_ASSIGNED, 9, 5],
    [ORDER_STATUS.COURIER_ASSIGNED, null, 5],
    [ORDER_STATUS.AWAITING_MANUAL_ASSIGNMENT, 5, null],
  ] as const)(
    'should refuse an order in %s expected with courier %s while it has %s with COURIER_CHANGED',
    async (status, expectedCourierId, currentCourierId) => {
      const { service, fake, dispatch } = setUp([[fakeOrderRow(status, currentCourierId)]]);

      const error = await rejection(service.restart({ ...REQUEST, expectedCourierId }));

      expect(error.getResponse()).toMatchObject({
        statusCode: 409,
        code: 'COURIER_CHANGED',
        currentCourierId,
      });
      expect(setCalls(fake)).toEqual([]);
      expect(dispatch).not.toHaveBeenCalled();
    },
  );

  it('should send nothing and dispatch nothing when the transaction rolls back', async () => {
    const { service, log, notifier, dispatch, publishOrderCourier } = setUp(
      [[fakeOrderRow(ORDER_STATUS.COURIER_ASSIGNED, 5)], [], [CONFIRMED], []],
      new Error('rolled back'),
    );

    await expect(service.restart(REQUEST)).rejects.toThrow('rolled back');

    expect(log).toEqual([]);
    expect(notifier.unassigned).not.toHaveBeenCalled();
    expect(publishOrderCourier).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('should keep the restart when the dispatch right after it fails', async () => {
    const { service, dispatch } = setUp([
      [fakeOrderRow(ORDER_STATUS.AWAITING_MANUAL_ASSIGNMENT)],
      [],
      [CONFIRMED],
      [],
    ]);
    dispatch.mockRejectedValueOnce(new Error('routing is down'));

    await expect(service.restart(NO_COURIER)).resolves.toEqual({
      orderId: 42,
      status: 'confirmed',
    });
  });
});
