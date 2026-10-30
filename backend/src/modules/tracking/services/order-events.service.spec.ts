import type { OrderStatusChange } from '@/common/database/order-status-transition';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { SOCKET_EVENTS } from '@/modules/realtime/constants/socket-events.constants';
import { staffOrderEventSchema } from '@/modules/realtime/dto/staff-order-event.dto';
import type { RealtimeEventsService } from '@/modules/realtime/services/realtime-events.service';
import { OrderEventsService } from './order-events.service';

const ETA = new Date('2026-10-22T12:30:00Z');
const CHANGED_AT = new Date('2026-10-22T12:00:00Z');

function change(overrides: Partial<OrderStatusChange>): OrderStatusChange {
  return {
    orderId: 1,
    status: ORDER_STATUS.CONFIRMED,
    estimatedDeliveryAt: null,
    statusChangedAt: CHANGED_AT,
    courierId: null,
    ...overrides,
  };
}

describe('OrderEventsService', () => {
  const toOrder = jest.fn();
  const toStaff = jest.fn();
  const calls: string[] = [];
  const service = new OrderEventsService({ toOrder, toStaff } as unknown as RealtimeEventsService);

  beforeEach(() => {
    calls.length = 0;
    toOrder.mockReset().mockImplementation((orderId: number) => calls.push(`order ${orderId}`));
    toStaff.mockReset().mockImplementation(() => calls.push('staff'));
  });

  it('should send order:status to the order room with the time as ISO or null', () => {
    service.publishStatusChanges([
      change({ orderId: 1, status: ORDER_STATUS.CONFIRMED, estimatedDeliveryAt: ETA }),
      change({ orderId: 2, status: ORDER_STATUS.CANCELLED }),
    ]);

    expect(toOrder.mock.calls).toEqual([
      [
        1,
        SOCKET_EVENTS.ORDER_STATUS,
        { orderId: 1, status: ORDER_STATUS.CONFIRMED, estimatedDeliveryAt: ETA.toISOString() },
      ],
      [
        2,
        SOCKET_EVENTS.ORDER_STATUS,
        { orderId: 2, status: ORDER_STATUS.CANCELLED, estimatedDeliveryAt: null },
      ],
    ]);
  });

  it('should send a light staff:order of kind status after each order room, never order:status', () => {
    service.publishStatusChanges([
      change({ orderId: 1, status: ORDER_STATUS.COURIER_ASSIGNED, courierId: 3 }),
      change({ orderId: 3, status: ORDER_STATUS.IN_TRANSIT, estimatedDeliveryAt: ETA }),
    ]);

    expect(toStaff.mock.calls).toEqual([
      [
        SOCKET_EVENTS.STAFF_ORDER,
        {
          orderId: 1,
          kind: 'status',
          status: ORDER_STATUS.COURIER_ASSIGNED,
          statusChangedAt: CHANGED_AT.toISOString(),
          courierId: 3,
        },
      ],
      [
        SOCKET_EVENTS.STAFF_ORDER,
        {
          orderId: 3,
          kind: 'status',
          status: ORDER_STATUS.IN_TRANSIT,
          statusChangedAt: CHANGED_AT.toISOString(),
          courierId: null,
        },
      ],
    ]);
    expect(calls).toEqual(['order 1', 'staff', 'order 3', 'staff']);
  });

  it('should send staff:order of kind created to the staff only', () => {
    service.publishCreated({
      orderId: 7,
      status: ORDER_STATUS.PENDING,
      statusChangedAt: CHANGED_AT,
      courierId: null,
    });

    expect(toOrder).not.toHaveBeenCalled();
    expect(toStaff.mock.calls).toEqual([
      [
        SOCKET_EVENTS.STAFF_ORDER,
        {
          orderId: 7,
          kind: 'created',
          status: ORDER_STATUS.PENDING,
          statusChangedAt: CHANGED_AT.toISOString(),
          courierId: null,
        },
      ],
    ]);
  });

  it('should send payloads that match the schema of staff:order and nothing personal', () => {
    service.publishStatusChanges([change({ courierId: 3 })]);
    service.publishCreated(change({ status: ORDER_STATUS.PENDING }));

    for (const [, payload] of toStaff.mock.calls as [string, unknown][]) {
      expect(staffOrderEventSchema.safeParse(payload).success).toBe(true);
    }
  });

  it('should send order:courier to the order room and staff:order of kind courier', () => {
    service.publishCourierChanges([
      {
        ...change({ orderId: 4, status: ORDER_STATUS.COURIER_ASSIGNED, courierId: 9 }),
        previousCourierId: 5,
      },
    ]);

    expect(toOrder.mock.calls).toEqual([
      [4, SOCKET_EVENTS.ORDER_COURIER, { orderId: 4, courierId: 9 }, { exceptCourierProfileId: 5 }],
    ]);
    expect(toStaff.mock.calls).toEqual([
      [
        SOCKET_EVENTS.STAFF_ORDER,
        {
          orderId: 4,
          kind: 'courier',
          status: ORDER_STATUS.COURIER_ASSIGNED,
          statusChangedAt: CHANGED_AT.toISOString(),
          courierId: 9,
        },
      ],
    ]);
    expect(calls).toEqual(['order 4', 'staff']);
  });

  it('should send order:courier with no courier when the courier is taken off', () => {
    service.publishOrderCourier(4, null);

    expect(toOrder).toHaveBeenCalledWith(
      4,
      SOCKET_EVENTS.ORDER_COURIER,
      { orderId: 4, courierId: null },
      { exceptCourierProfileId: undefined },
    );
    expect(toStaff).not.toHaveBeenCalled();
  });

  it('should send nothing when no status changed', () => {
    service.publishStatusChanges([]);

    expect(toOrder).not.toHaveBeenCalled();
    expect(toStaff).not.toHaveBeenCalled();
  });
});
