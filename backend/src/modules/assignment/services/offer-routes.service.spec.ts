import { Test } from '@nestjs/testing';
import { VEHICLE_TYPE } from '../../../common/enums/vehicle-type.enum';
import { OSRM_PROFILE } from '../../../integrations/osrm/constants/osrm.constants';
import { OsrmService } from '../../../integrations/osrm/services/osrm.service';
import type { CourierCandidate, DispatchOrder } from '../types/assignment.types';
import { OfferRoutesService } from './offer-routes.service';

const PICKUP = { latitude: 53.9006, longitude: 27.559 };
const DELIVERY = { latitude: 53.9075, longitude: 27.457 };

const ORDER: DispatchOrder = {
  orderId: 1,
  pickup: PICKUP,
  delivery: DELIVERY,
  parcel: { weightKg: 1, lengthCm: 20, widthCm: 15, heightCm: 10, isFragile: false },
};

const BY_CAR: CourierCandidate = {
  courierProfileId: 1,
  vehicleType: VEHICLE_TYPE.CAR,
  position: { latitude: 53.91, longitude: 27.56 },
  distanceKm: 1,
};

const ON_FOOT: CourierCandidate = {
  courierProfileId: 2,
  vehicleType: VEHICLE_TYPE.FOOT,
  position: { latitude: 53.901, longitude: 27.559 },
  distanceKm: 0.1,
};

function route(durationSec: number) {
  return { distanceKm: 1, durationSec };
}

describe('OfferRoutesService', () => {
  let service: OfferRoutesService;
  const getRoute = jest.fn();

  beforeEach(async () => {
    getRoute.mockReset();
    const moduleRef = await Test.createTestingModule({
      providers: [OfferRoutesService, { provide: OsrmService, useValue: { getRoute } }],
    }).compile();
    service = moduleRef.get(OfferRoutesService);
  });

  it('should choose the courier with the shortest way to the pickup point', async () => {
    getRoute
      .mockResolvedValueOnce(route(600))
      .mockResolvedValueOnce(route(300))
      .mockResolvedValueOnce(route(900));

    const plan = await service.plan(ORDER, [BY_CAR, ON_FOOT]);

    expect(plan).toEqual({ courierProfileId: 2, pickupEtaSec: 300, totalEtaSec: 1200 });
    expect(getRoute).toHaveBeenLastCalledWith(PICKUP, DELIVERY, OSRM_PROFILE.FOOT);
  });

  it('should round both route times up to whole seconds', async () => {
    getRoute.mockResolvedValueOnce(route(600.2)).mockResolvedValueOnce(route(899.1));

    const plan = await service.plan(ORDER, [BY_CAR]);

    expect(plan).toEqual({ courierProfileId: 1, pickupEtaSec: 601, totalEtaSec: 1501 });
  });

  it('should skip the courier when the route to the pickup point fails', async () => {
    getRoute
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce(route(300))
      .mockResolvedValueOnce(route(900));

    const plan = await service.plan(ORDER, [BY_CAR, ON_FOOT]);

    expect(plan?.courierProfileId).toBe(ON_FOOT.courierProfileId);
  });

  it('should return null when no route to the pickup point is built', async () => {
    getRoute.mockRejectedValue(new Error('timeout'));

    expect(await service.plan(ORDER, [BY_CAR, ON_FOOT])).toBeNull();
  });

  it('should return null when the route to the recipient fails', async () => {
    getRoute.mockResolvedValueOnce(route(300)).mockRejectedValueOnce(new Error('timeout'));

    expect(await service.plan(ORDER, [BY_CAR])).toBeNull();
  });
});
