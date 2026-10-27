import { Logger } from '@nestjs/common';
import { ORDER_STATUS, type OrderStatus } from '@/common/enums/order-status.enum';
import type { OsrmTripService } from '@/integrations/osrm/services/osrm-trip.service';
import { SOCKET_EVENTS } from '@/modules/realtime/constants/socket-events.constants';
import type { RealtimeEventsService } from '@/modules/realtime/services/realtime-events.service';
import type { CourierLocationEventsService } from '@/modules/couriers/services/courier-location-events.service';
import { ETA_RECALC_INTERVAL_MS } from '../constants/tracking.constants';
import type { EtaSource } from '../types/tracking.types';
import type { OrderEtaDataService } from './order-eta-data.service';
import { OrderEtaStore } from './order-eta-store.service';
import { OrderEtaService } from './order-eta.service';

const ORDER_ID = 7;
const START_MS = Date.parse('2026-10-22T12:00:00Z');
// After the pickup the trip is one leg, to the recipient.
const TRIP = { durationS: 600, firstLegDurationS: 600, firstLegGeometry: 'leg' };

function source(overrides: Partial<EtaSource> = {}): EtaSource {
  return {
    status: ORDER_STATUS.IN_TRANSIT,
    pickup: { latitude: 53.9, longitude: 27.55 },
    delivery: { latitude: 53.91, longitude: 27.45 },
    vehicleType: 'car',
    position: { latitude: 53.92, longitude: 27.6 },
    locationUpdatedAt: new Date(START_MS),
    positionAgeMs: 1_000,
    ...overrides,
  };
}

describe('OrderEtaService', () => {
  const data = { load: jest.fn(), save: jest.fn() };
  const trips = { isAvailable: jest.fn(), getTrip: jest.fn() };
  const gateway = { toOrder: jest.fn() };
  let store: OrderEtaStore;
  let service: OrderEtaService;
  let nowMs: number;

  beforeAll(() => {
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);
    jest.spyOn(Date, 'now').mockImplementation(() => nowMs);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    nowMs = START_MS;
    jest.clearAllMocks();
    data.load.mockResolvedValue(source());
    data.save.mockImplementation((_id: number, _status: OrderStatus, eta: Date) =>
      Promise.resolve(eta),
    );
    trips.isAvailable.mockReturnValue(true);
    trips.getTrip.mockResolvedValue(TRIP);
    store = new OrderEtaStore();
    service = new OrderEtaService(
      store,
      data as unknown as OrderEtaDataService,
      trips as unknown as OsrmTripService,
      gateway as unknown as RealtimeEventsService,
      { subscribe: jest.fn() } as unknown as CourierLocationEventsService,
    );
  });

  it('should send the estimate and keep the line of the courier', async () => {
    await service.refresh(ORDER_ID, false);

    expect(gateway.toOrder).toHaveBeenCalledWith(ORDER_ID, SOCKET_EVENTS.ORDER_ETA, {
      orderId: ORDER_ID,
      estimatedDeliveryAt: new Date(START_MS + 600_000 + 120_000).toISOString(),
      courierLeg: { geometry: 'leg', toPoint: 'dropoff' },
      pickupEtaAt: null,
    });
    expect(service.courierLeg(ORDER_ID)).toEqual({ geometry: 'leg', toPoint: 'dropoff' });
  });

  it('should ask again only once the interval has passed', async () => {
    await service.refresh(ORDER_ID, false);
    nowMs = START_MS + ETA_RECALC_INTERVAL_MS - 1;
    await service.refresh(ORDER_ID, false);
    expect(trips.getTrip).toHaveBeenCalledTimes(1);

    nowMs = START_MS + ETA_RECALC_INTERVAL_MS;
    await service.refresh(ORDER_ID, false);
    expect(trips.getTrip).toHaveBeenCalledTimes(2);
  });

  it('should ask at once on a new status, inside the interval', async () => {
    await service.refresh(ORDER_ID, false);

    service.onStatusChanges([
      { orderId: ORDER_ID, status: ORDER_STATUS.IN_TRANSIT, estimatedDeliveryAt: null },
    ]);
    await new Promise(setImmediate);

    expect(trips.getTrip).toHaveBeenCalledTimes(2);
  });

  it('should run one estimate of an order at a time and the forced one after it', async () => {
    let finishTrip: (trip: typeof TRIP) => void = () => undefined;
    trips.getTrip.mockReturnValueOnce(new Promise((resolve) => (finishTrip = resolve)));

    const first = service.refresh(ORDER_ID, false);
    await new Promise(setImmediate);
    await service.refresh(ORDER_ID, false);
    await service.refresh(ORDER_ID, true);
    expect(trips.getTrip).toHaveBeenCalledTimes(1);

    finishTrip(TRIP);
    await first;
    expect(trips.getTrip).toHaveBeenCalledTimes(2);
  });

  it('should wait for a running estimate on shutdown and start no new one', async () => {
    let finishTrip: (trip: typeof TRIP) => void = () => undefined;
    trips.getTrip.mockReturnValueOnce(new Promise((resolve) => (finishTrip = resolve)));
    void service.refresh(ORDER_ID, false);
    await new Promise(setImmediate);

    let stopped = false;
    const shutdown = service.onApplicationShutdown().then(() => (stopped = true));
    await new Promise(setImmediate);
    expect(stopped).toBe(false);

    finishTrip(TRIP);
    await shutdown;
    await service.refresh(ORDER_ID + 1, true);
    expect(gateway.toOrder).toHaveBeenCalledTimes(1);
    expect(trips.getTrip).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['the position is stale', () => data.load.mockResolvedValue(source({ positionAgeMs: 60_001 }))],
    ['there is no position', () => data.load.mockResolvedValue(source({ position: null }))],
    ['the breaker is open', () => trips.isAvailable.mockReturnValue(false)],
  ])('should skip without asking the routing service when %s', async (_, arrange) => {
    arrange();

    await service.refresh(ORDER_ID, true);

    expect(trips.getTrip).not.toHaveBeenCalled();
    expect(gateway.toOrder).not.toHaveBeenCalled();
  });

  it('should not read the order while the breaker is open', async () => {
    trips.isAvailable.mockReturnValue(false);

    await service.refresh(ORDER_ID, true);

    expect(data.load).not.toHaveBeenCalled();
  });

  it('should skip and forget an order that is no longer active', async () => {
    data.load.mockResolvedValue(source({ status: ORDER_STATUS.DELIVERED }));

    await service.refresh(ORDER_ID, true);

    expect(trips.getTrip).not.toHaveBeenCalled();
    expect(store.get(ORDER_ID)).toBeUndefined();
  });

  it('should forget the order once it is over', async () => {
    await service.refresh(ORDER_ID, false);

    service.onStatusChanges([
      { orderId: ORDER_ID, status: ORDER_STATUS.DELIVERED, estimatedDeliveryAt: null },
    ]);

    expect(store.size).toBe(0);
  });

  it('should send nothing when the row was skipped or the status changed', async () => {
    data.save.mockResolvedValue(null);

    await service.refresh(ORDER_ID, true);

    expect(data.save).toHaveBeenCalledWith(ORDER_ID, ORDER_STATUS.IN_TRANSIT, expect.any(Date));
    expect(gateway.toOrder).not.toHaveBeenCalled();
    expect(store.get(ORDER_ID)?.courierLeg).toBeNull();
  });
});
