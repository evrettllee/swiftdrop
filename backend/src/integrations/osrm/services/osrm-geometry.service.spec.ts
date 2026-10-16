import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  OSRM_FAILURE_THRESHOLD,
  OSRM_PROFILE,
  ROUTE_GEOMETRY_CACHE_TTL_MS,
} from '../constants/osrm.constants';
import { OsrmClient } from './osrm-client.service';
import { OsrmGeometryService } from './osrm-geometry.service';

const BASE_URL = 'https://osrm.test';
const FROM = { latitude: 53.9006, longitude: 27.559 };
const TO = { latitude: 53.9075, longitude: 27.457 };
const GEOMETRY = 'gylxeBimlps@zAuPdPcQ';
const START_MS = 1_000_000;
const NO_ROUTE_STATUS = 400;
const okBody = {
  code: 'Ok',
  routes: [{ distance: 7626.5, duration: 635.4, geometry: GEOMETRY }],
};

function jsonResponse(body: unknown, status = 200): Promise<Response> {
  return Promise.resolve(new Response(JSON.stringify(body), { status }));
}

describe('OsrmGeometryService', () => {
  let service: OsrmGeometryService;
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    service = new OsrmGeometryService(new OsrmClient(new ConfigService({ OSRM_URL: BASE_URL })));
    jest.spyOn(Date, 'now').mockReturnValue(START_MS);
    fetchSpy = jest.spyOn(globalThis, 'fetch').mockImplementation(() => jsonResponse(okBody));
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return the polyline, the distance in meters and the duration in seconds', async () => {
    await expect(service.getRouteGeometry([FROM, TO], OSRM_PROFILE.CAR)).resolves.toEqual({
      geometry: GEOMETRY,
      distanceM: 7626.5,
      durationS: 635.4,
    });
  });

  it('should ask for the full line as polyline6 without steps, longitude first', async () => {
    await service.getRouteGeometry([FROM, TO], OSRM_PROFILE.BIKE);

    expect(fetchSpy).toHaveBeenCalledWith(
      `${BASE_URL}/routed-bike/route/v1/driving/27.559,53.9006;27.457,53.9075` +
        '?overview=full&geometries=polyline6&steps=false',
      expect.anything(),
    );
  });

  it('should pass every point of the route in order', async () => {
    const via = { latitude: 53.91, longitude: 27.5 };

    await service.getRouteGeometry([FROM, via, TO], OSRM_PROFILE.CAR);

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/27.559,53.9006;27.5,53.91;27.457,53.9075?'),
      expect.anything(),
    );
  });

  it('should answer a repeated request from the cache without asking the service', async () => {
    await service.getRouteGeometry([FROM, TO], OSRM_PROFILE.CAR);
    const nearFrom = { latitude: 53.90062, longitude: 27.55901 };

    await expect(service.getRouteGeometry([nearFrom, TO], OSRM_PROFILE.CAR)).resolves.toMatchObject(
      {
        geometry: GEOMETRY,
      },
    );
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('should ask the service again once the cached line is old', async () => {
    await service.getRouteGeometry([FROM, TO], OSRM_PROFILE.CAR);
    jest.spyOn(Date, 'now').mockReturnValue(START_MS + ROUTE_GEOMETRY_CACHE_TTL_MS);

    await service.getRouteGeometry([FROM, TO], OSRM_PROFILE.CAR);

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('should return null when the request fails and not cache it', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('network down'));

    await expect(service.getRouteGeometry([FROM, TO], OSRM_PROFILE.CAR)).resolves.toBeNull();
    await expect(service.getRouteGeometry([FROM, TO], OSRM_PROFILE.CAR)).resolves.not.toBeNull();
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('should return null when no route exists between the points', async () => {
    fetchSpy.mockImplementation(() => jsonResponse({ code: 'NoRoute' }, NO_ROUTE_STATUS));

    await expect(service.getRouteGeometry([FROM, TO], OSRM_PROFILE.CAR)).resolves.toBeNull();
  });

  it('should return null when the route comes without the geometry', async () => {
    fetchSpy.mockImplementation(() =>
      jsonResponse({ code: 'Ok', routes: [{ distance: 1, duration: 1 }] }),
    );

    await expect(service.getRouteGeometry([FROM, TO], OSRM_PROFILE.CAR)).resolves.toBeNull();
  });

  it('should return null when the geometry is not a string', async () => {
    fetchSpy.mockImplementation(() =>
      jsonResponse({ code: 'Ok', routes: [{ distance: 1, duration: 1, geometry: [] }] }),
    );

    await expect(service.getRouteGeometry([FROM, TO], OSRM_PROFILE.CAR)).resolves.toBeNull();
  });

  it('should return null at once without a request while the breaker is open', async () => {
    fetchSpy.mockRejectedValue(new Error('network down'));

    for (let index = 0; index < OSRM_FAILURE_THRESHOLD; index += 1) {
      await service.getRouteGeometry([FROM, { ...TO, latitude: index }], OSRM_PROFILE.CAR);
    }

    fetchSpy.mockClear();

    await expect(service.getRouteGeometry([FROM, TO], OSRM_PROFILE.CAR)).resolves.toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
