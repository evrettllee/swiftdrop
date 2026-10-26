import { Logger } from '@nestjs/common';
import { ORDER_STATUS, type OrderStatus } from '../../../common/enums/order-status.enum';
import type { OsrmTripService } from '../../../integrations/osrm/services/osrm-trip.service';
import type { CouriersGateway } from '../../couriers/gateways/couriers.gateway';
import type { CourierLocationEventsService } from '../../couriers/services/courier-location-events.service';
import { ORDER_ROOM_EVENTS } from '../constants/tracking.constants';
import type { EtaSource } from '../types/tracking.types';
import type { OrderEtaDataService } from './order-eta-data.service';
import { OrderEtaStore } from './order-eta-store.service';
import { OrderEtaService } from './order-eta.service';

const ORDER_ID = 7;
const START_MS = Date.parse('2026-10-22T12:00:00Z');
// Before the pickup the trip has two legs: 4 minutes to the sender, then on to the recipient.
const TRIP_VIA_PICKUP = { durationS: 840, firstLegDurationS: 240, firstLegGeometry: 'leg' };
// After the pickup the trip is one leg, to the recipient.
const TRIP_TO_RECIPIENT = { durationS: 600, firstLegDurationS: 600, firstLegGeometry: 'leg' };

function source(status: OrderStatus): EtaSource {
  return {
    status,
    pickup: { latitude: 53.9, longitude: 27.55 },
    delivery: { latitude: 53.91, longitude: 27.45 },
    vehicleType: 'car',
    position: { latitude: 53.92, longitude: 27.6 },
    locationUpdatedAt: new Date(START_MS),
    positionAgeMs: 1_000,
  };
}

// The arrival of the courier at the pickup point, counted with the arrival estimate.
describe('OrderEtaService arrival at the pickup point', () => {
  const data = { load: jest.fn(), save: jest.fn() };
  const trips = { isAvailable: jest.fn(), getTrip: jest.fn() };
  const gateway = { emitToOrder: jest.fn() };
  let service: OrderEtaService;

  beforeAll(() => {
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);
    jest.spyOn(Date, 'now').mockImplementation(() => START_MS);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    data.save.mockImplementation((_id: number, _status: OrderStatus, eta: Date) =>
      Promise.resolve(eta),
    );
    trips.isAvailable.mockReturnValue(true);
    service = new OrderEtaService(
      new OrderEtaStore(),
      data as unknown as OrderEtaDataService,
      trips as unknown as OsrmTripService,
      gateway as unknown as CouriersGateway,
      { subscribe: jest.fn() } as unknown as CourierLocationEventsService,
    );
  });

  it('should send the arrival at the pickup point while the courier goes there', async () => {
    data.load.mockResolvedValue(source(ORDER_STATUS.COURIER_ASSIGNED));
    trips.getTrip.mockResolvedValue(TRIP_VIA_PICKUP);

    await service.refresh(ORDER_ID, false);

    // The pickup is the first leg alone; the delivery adds the rest and the 3 + 2 minutes of the
    // handovers.
    expect(gateway.emitToOrder).toHaveBeenCalledWith(ORDER_ID, ORDER_ROOM_EVENTS.ORDER_ETA, {
      orderId: ORDER_ID,
      estimatedDeliveryAt: '2026-10-22T12:19:00.000Z',
      courierLeg: { geometry: 'leg', toPoint: 'pickup' },
      pickupEtaAt: '2026-10-22T12:04:00.000Z',
    });
    expect(service.pickupEtaAt(ORDER_ID)).toBe('2026-10-22T12:04:00.000Z');
  });

  it.each([ORDER_STATUS.PICKED_UP, ORDER_STATUS.IN_TRANSIT])(
    'should send no arrival at the pickup point once the order is %s',
    async (status) => {
      data.load.mockResolvedValue(source(status));
      trips.getTrip.mockResolvedValue(TRIP_TO_RECIPIENT);

      await service.refresh(ORDER_ID, false);

      expect(gateway.emitToOrder).toHaveBeenCalledWith(
        ORDER_ID,
        ORDER_ROOM_EVENTS.ORDER_ETA,
        expect.objectContaining({ pickupEtaAt: null }),
      );
      expect(service.pickupEtaAt(ORDER_ID)).toBeNull();
    },
  );

  it('should replace the arrival at the pickup point once the parcel is picked up', async () => {
    data.load.mockResolvedValue(source(ORDER_STATUS.COURIER_ASSIGNED));
    trips.getTrip.mockResolvedValue(TRIP_VIA_PICKUP);
    await service.refresh(ORDER_ID, false);
    data.load.mockResolvedValue(source(ORDER_STATUS.PICKED_UP));
    trips.getTrip.mockResolvedValue(TRIP_TO_RECIPIENT);

    service.onStatusChanges([
      { orderId: ORDER_ID, status: ORDER_STATUS.PICKED_UP, estimatedDeliveryAt: null },
    ]);
    await new Promise(setImmediate);

    expect(service.pickupEtaAt(ORDER_ID)).toBeNull();
  });

  it('should keep no arrival when the estimate was not saved', async () => {
    data.load.mockResolvedValue(source(ORDER_STATUS.COURIER_ASSIGNED));
    trips.getTrip.mockResolvedValue(TRIP_VIA_PICKUP);
    data.save.mockResolvedValue(null);

    await service.refresh(ORDER_ID, true);

    expect(gateway.emitToOrder).not.toHaveBeenCalled();
    expect(service.pickupEtaAt(ORDER_ID)).toBeNull();
  });

  it('should keep no arrival for an order never estimated', () => {
    expect(service.pickupEtaAt(ORDER_ID)).toBeNull();
  });
});
