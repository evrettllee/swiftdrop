import { Logger } from '@nestjs/common';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import type { CouriersGateway } from '@/modules/couriers/gateways/couriers.gateway';
import { ORDER_ROOM_EVENTS } from '../constants/tracking.constants';
import { OrderEventsService } from './order-events.service';

const ETA = new Date('2026-10-22T12:30:00Z');

describe('OrderEventsService', () => {
  const emitToOrder = jest.fn();
  const service = new OrderEventsService({ emitToOrder } as unknown as CouriersGateway);
  const logError = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

  beforeEach(() => {
    emitToOrder.mockReset();
    logError.mockClear();
  });

  afterAll(() => {
    logError.mockRestore();
  });

  it('should send order:status with the time as ISO or null', () => {
    service.publishStatusChanges([
      { orderId: 1, status: ORDER_STATUS.CONFIRMED, estimatedDeliveryAt: ETA },
      { orderId: 2, status: ORDER_STATUS.CANCELLED, estimatedDeliveryAt: null },
    ]);

    expect(emitToOrder.mock.calls).toEqual([
      [
        1,
        ORDER_ROOM_EVENTS.ORDER_STATUS,
        { orderId: 1, status: ORDER_STATUS.CONFIRMED, estimatedDeliveryAt: ETA.toISOString() },
      ],
      [
        2,
        ORDER_ROOM_EVENTS.ORDER_STATUS,
        { orderId: 2, status: ORDER_STATUS.CANCELLED, estimatedDeliveryAt: null },
      ],
    ]);
  });

  it('should log a failed send and go on with the next change', () => {
    emitToOrder.mockImplementationOnce(() => {
      throw new Error('socket server is down');
    });

    expect(() =>
      service.publishStatusChanges([
        { orderId: 1, status: ORDER_STATUS.PICKED_UP, estimatedDeliveryAt: null },
        { orderId: 1, status: ORDER_STATUS.IN_TRANSIT, estimatedDeliveryAt: null },
      ]),
    ).not.toThrow();
    expect(logError).toHaveBeenCalledTimes(1);
    expect(emitToOrder).toHaveBeenCalledTimes(2);
  });
});
