import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { SOCKET_EVENTS } from '@/modules/realtime/constants/socket-events.constants';
import type { RealtimeEventsService } from '@/modules/realtime/services/realtime-events.service';
import { OrderEventsService } from './order-events.service';

const ETA = new Date('2026-10-22T12:30:00Z');

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
      { orderId: 1, status: ORDER_STATUS.CONFIRMED, estimatedDeliveryAt: ETA },
      { orderId: 2, status: ORDER_STATUS.CANCELLED, estimatedDeliveryAt: null },
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

  it('should send the same order:status to the staff after each order room', () => {
    service.publishStatusChanges([
      { orderId: 1, status: ORDER_STATUS.PICKED_UP, estimatedDeliveryAt: null },
      { orderId: 3, status: ORDER_STATUS.IN_TRANSIT, estimatedDeliveryAt: ETA },
    ]);

    expect(toStaff.mock.calls).toEqual([
      [SOCKET_EVENTS.ORDER_STATUS, toOrder.mock.calls[0]?.[2]],
      [SOCKET_EVENTS.ORDER_STATUS, toOrder.mock.calls[1]?.[2]],
    ]);
    expect(calls).toEqual(['order 1', 'staff', 'order 3', 'staff']);
  });

  it('should send nothing when no status changed', () => {
    service.publishStatusChanges([]);

    expect(toOrder).not.toHaveBeenCalled();
    expect(toStaff).not.toHaveBeenCalled();
  });
});
