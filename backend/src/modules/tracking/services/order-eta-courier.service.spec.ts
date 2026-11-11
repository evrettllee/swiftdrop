import { Logger } from '@nestjs/common';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import type { OsrmTripService } from '@/integrations/osrm/services/osrm-trip.service';
import type { CourierLocationEventsService } from '@/modules/couriers/services/courier-location-events.service';
import type { RealtimeEventsService } from '@/modules/realtime/services/realtime-events.service';
import type { OrderEtaDataService } from './order-eta-data.service';
import { OrderEtaStore } from './order-eta-store.service';
import { OrderEtaService } from './order-eta.service';

const ORDER_ID = 7;
const CHANGE = {
  orderId: ORDER_ID,
  status: ORDER_STATUS.COURIER_ASSIGNED,
  estimatedDeliveryAt: null,
  statusChangedAt: new Date(),
  courierId: 9,
};
const OLD_LEG = {
  geometry: 'old',
  toPoint: 'pickup' as const,
  basedOnUpdatedAt: new Date(),
  pickupEtaAt: null,
};

describe('OrderEtaService on a new courier', () => {
  const load = jest.fn();

  beforeAll(() => {
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should drop the line of the old courier and estimate again at once', async () => {
    const store = new OrderEtaStore();
    const service = new OrderEtaService(
      store,
      { load } as unknown as OrderEtaDataService,
      { isAvailable: () => true } as unknown as OsrmTripService,
      { toOrder: jest.fn() } as unknown as RealtimeEventsService,
      { subscribe: jest.fn() } as unknown as CourierLocationEventsService,
    );
    const entry = store.ensure(ORDER_ID);
    entry.computedAtMs = Date.now();
    entry.courierLeg = OLD_LEG;
    load.mockResolvedValue(null);

    service.onCourierChanges([CHANGE]);
    await new Promise(setImmediate);

    expect(load).toHaveBeenCalledWith(ORDER_ID);
    expect(store.get(ORDER_ID)?.courierLeg ?? null).toBeNull();
  });
});
