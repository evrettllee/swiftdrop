import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OSRM_PROFILE } from '../constants/osrm.constants';
import { OsrmClient } from './osrm-client.service';
import { OsrmTripService } from './osrm-trip.service';

const BASE_URL = 'https://osrm.test';
const COURIER = { latitude: 53.92, longitude: 27.6 };
const PICKUP = { latitude: 53.9006, longitude: 27.559 };
const DELIVERY = { latitude: 53.9075, longitude: 27.457 };
// A line that ends at the snapped pickup point, so the whole of it is the first leg.
const GEOMETRY = 'gylxeBimlps@zAuPdPcQ';

function jsonResponse(body: unknown): Promise<Response> {
  return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
}

// An answer for one leg or two: the whole time and the time of each leg, in seconds.
function tripBody(legDurations: number[]) {
  return {
    code: 'Ok',
    routes: [
      {
        distance: 9000,
        duration: legDurations.reduce((sum, duration) => sum + duration, 0),
        geometry: GEOMETRY,
        legs: legDurations.map((duration) => ({ duration })),
      },
    ],
    waypoints: [
      { location: [COURIER.longitude, COURIER.latitude] },
      { location: [PICKUP.longitude, PICKUP.latitude] },
      { location: [DELIVERY.longitude, DELIVERY.latitude] },
    ],
  };
}

describe('OsrmTripService', () => {
  let service: OsrmTripService;
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    service = new OsrmTripService(new OsrmClient(new ConfigService({ OSRM_URL: BASE_URL })));
    fetchSpy = jest.spyOn(globalThis, 'fetch');
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should give the whole time and the time of the first leg from one answer', async () => {
    fetchSpy.mockImplementation(() => jsonResponse(tripBody([240.5, 600])));

    const trip = await service.getTrip([COURIER, PICKUP, DELIVERY], OSRM_PROFILE.CAR);

    expect(trip).toMatchObject({ durationS: 840.5, firstLegDurationS: 240.5 });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('should give the whole time as the first leg of a trip of one leg', async () => {
    fetchSpy.mockImplementation(() => jsonResponse(tripBody([420])));

    const trip = await service.getTrip([COURIER, DELIVERY], OSRM_PROFILE.CAR);

    expect(trip).toEqual({ durationS: 420, firstLegDurationS: 420, firstLegGeometry: GEOMETRY });
  });

  it('should give no trip when the answer has no legs', async () => {
    const { legs: _legs, ...route } = tripBody([240, 600]).routes[0];
    fetchSpy.mockImplementation(() => jsonResponse({ ...tripBody([240, 600]), routes: [route] }));

    await expect(
      service.getTrip([COURIER, PICKUP, DELIVERY], OSRM_PROFILE.CAR),
    ).resolves.toBeNull();
  });
});
