import { ConflictException } from '@nestjs/common';
import { DatabaseError } from 'pg';
import type { OrderTransaction } from '@/common/database/order-status-transition';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import type { PaymentCancellationService } from '@/modules/payments/services/payment-cancellation.service';
import { SOCKET_EVENTS } from '@/modules/realtime/constants/socket-events.constants';
import type { RealtimeEventsService } from '@/modules/realtime/services/realtime-events.service';
import type { OrderTransactionsService } from '@/modules/tracking/services/order-transactions.service';
import { queueDatabase } from '@test/support/queue-database';
import { CancelOrderService } from './cancel-order.service';

const CANCELLED = {
  orderId: 42,
  status: ORDER_STATUS.CANCELLED,
  estimatedDeliveryAt: null,
  statusChangedAt: new Date('2026-10-30T10:00:00Z'),
  courierId: 5,
};
const STAFF_REQUEST = { orderId: 42, changedBy: 7, comment: 'Адрес вне зоны доставки' };
const SUCCESS = [
  [{ status: ORDER_STATUS.COURIER_ASSIGNED, courierId: 5 }],
  [{ offerId: 9, courierId: 4 }],
  [CANCELLED],
  [],
];

function setUp(results: unknown[][], failure?: Error) {
  const fake = queueDatabase(results);
  const log: string[] = [];
  const run = jest.fn(async (work: (orderTx: OrderTransaction) => Promise<unknown>) => {
    const result = await work({ tx: fake.tx, statusChanges: [], courierChanges: [] });

    if (failure) {
      throw failure;
    }

    log.push('commit');

    return result;
  });
  const releaseOrderPayments = jest.fn(() => {
    log.push('release payments');

    return Promise.resolve('refunded');
  });
  const events = {
    toCourier: jest.fn((courierId: number, event: string) => log.push(`${event} to ${courierId}`)),
    removeCourierFromOrder: jest.fn((orderId: number, courierId: number) =>
      log.push(`courier ${courierId} leaves order ${orderId}`),
    ),
  };
  const service = new CancelOrderService(
    { releaseOrderPayments } as unknown as PaymentCancellationService,
    events as unknown as RealtimeEventsService,
    { run } as unknown as OrderTransactionsService,
  );

  return { service, fake, log, events, releaseOrderPayments };
}

function argsOf(fake: ReturnType<typeof queueDatabase>, method: string): unknown[] {
  return fake.calls.filter((call) => call.method === method).map((call) => call.args[0]);
}

describe('CancelOrderService', () => {
  it('should lock the order, revoke offers, cancel, release payments, then tell the couriers', async () => {
    const { service, fake, log } = setUp(SUCCESS);

    await expect(service.cancel(STAFF_REQUEST)).resolves.toEqual({
      cancelled: true,
      refund: 'refunded',
    });

    expect(argsOf(fake, 'for')).toEqual(['update']);
    expect(argsOf(fake, 'set')).toEqual([
      { status: 'revoked' },
      expect.objectContaining({ status: ORDER_STATUS.CANCELLED }),
    ]);
    expect(argsOf(fake, 'values')).toEqual([
      { orderId: 42, status: ORDER_STATUS.CANCELLED, changedBy: 7, comment: STAFF_REQUEST.comment },
    ]);
    expect(log).toEqual([
      'release payments',
      'commit',
      `${SOCKET_EVENTS.OFFER_CLOSED} to 4`,
      `${SOCKET_EVENTS.ORDER_CANCELLED} to 5`,
      'courier 5 leaves order 42',
    ]);
  });

  it('should tell no courier when the order had none', async () => {
    const { service, events } = setUp([
      [{ status: ORDER_STATUS.CONFIRMED, courierId: null }],
      [],
      [CANCELLED],
      [],
    ]);

    await service.cancel({ ...STAFF_REQUEST, comment: null });

    expect(events.toCourier).not.toHaveBeenCalled();
    expect(events.removeCourierFromOrder).not.toHaveBeenCalled();
  });

  it.each([['pending'], ['none']])(
    'should give the refund %s as the payments ended',
    async (refund) => {
      const { service, releaseOrderPayments } = setUp(SUCCESS);
      releaseOrderPayments.mockResolvedValueOnce(refund);

      await expect(service.cancel(STAFF_REQUEST)).resolves.toEqual({ cancelled: true, refund });
    },
  );

  it('should refuse a missing or foreign order with no status and change nothing', async () => {
    const { service, fake, releaseOrderPayments } = setUp([[]]);

    await expect(service.cancel({ ...STAFF_REQUEST, clientId: 3 })).resolves.toEqual({
      cancelled: false,
      status: null,
    });
    expect(argsOf(fake, 'set')).toEqual([]);
    expect(releaseOrderPayments).not.toHaveBeenCalled();
  });

  it.each([
    ORDER_STATUS.PICKED_UP,
    ORDER_STATUS.IN_TRANSIT,
    ORDER_STATUS.DELIVERED,
    ORDER_STATUS.CANCELLED,
  ])('should refuse an order in %s with its status', async (status) => {
    const { service, fake, events } = setUp([[{ status, courierId: 5 }]]);

    await expect(service.cancel(STAFF_REQUEST)).resolves.toEqual({ cancelled: false, status });
    expect(argsOf(fake, 'set')).toEqual([]);
    expect(events.toCourier).not.toHaveBeenCalled();
  });

  it('should tell nobody when the transaction rolls back, for example on a failed refund', async () => {
    const { service, log, events } = setUp(SUCCESS, new Error('refund failed'));

    await expect(service.cancel(STAFF_REQUEST)).rejects.toThrow('refund failed');

    expect(log).toEqual(['release payments']);
    expect(events.toCourier).not.toHaveBeenCalled();
    expect(events.removeCourierFromOrder).not.toHaveBeenCalled();
  });

  it('should answer busy when the order stays locked', async () => {
    const timeout = Object.assign(new DatabaseError('lock timeout', 0, 'error'), { code: '55P03' });
    const { service } = setUp(SUCCESS, timeout);

    await expect(service.cancel(STAFF_REQUEST)).rejects.toThrow(ConflictException);
  });
});
