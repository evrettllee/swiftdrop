import { Logger, ServiceUnavailableException, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OSRM_PROFILE } from '../constants/osrm.constants';
import { OsrmClient } from './osrm-client.service';
import { OsrmService } from './osrm.service';

const BASE_URL = 'https://osrm.test';
const FROM = { latitude: 53.9006, longitude: 27.559 };
const TO = { latitude: 53.9075, longitude: 27.457 };
const ROUTE_DISTANCE_M = 6300;
const ROUTE_DURATION_SEC = 420.5;
const ROUTE_DISTANCE_KM = 6.3;
const NO_ROUTE_STATUS = 400;

function buildService(baseUrl = BASE_URL): OsrmService {
  return new OsrmService(new OsrmClient(new ConfigService({ OSRM_URL: baseUrl })));
}

function mockJsonResponse(body: unknown, status = 200): jest.SpyInstance {
  return jest
    .spyOn(globalThis, 'fetch')
    .mockImplementation(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
}

const okBody = {
  code: 'Ok',
  routes: [{ distance: ROUTE_DISTANCE_M, duration: ROUTE_DURATION_SEC }],
};

describe('OsrmService', () => {
  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return the distance in kilometers and the duration when a route is found', async () => {
    mockJsonResponse(okBody);

    await expect(buildService().getRoute(FROM, TO)).resolves.toEqual({
      distanceKm: ROUTE_DISTANCE_KM,
      durationSec: ROUTE_DURATION_SEC,
    });
  });

  it('should request the car service with longitude before latitude by default', async () => {
    const fetchSpy = mockJsonResponse(okBody);

    await buildService().getRoute(FROM, TO);

    expect(fetchSpy).toHaveBeenCalledWith(
      `${BASE_URL}/routed-car/route/v1/driving/27.559,53.9006;27.457,53.9075?overview=false`,
      expect.anything(),
    );
  });

  it('should request the bike service when the bike profile is passed', async () => {
    const fetchSpy = mockJsonResponse(okBody);

    await buildService().getRoute(FROM, TO, OSRM_PROFILE.BIKE);

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/routed-bike/'),
      expect.anything(),
    );
  });

  it('should not double the slash when the base url ends with one', async () => {
    const fetchSpy = mockJsonResponse(okBody);

    await buildService(`${BASE_URL}/`).getRoute(FROM, TO);

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining(`${BASE_URL}/routed-car/`),
      expect.anything(),
    );
  });

  it('should throw UnprocessableEntityException when OSRM finds no route', async () => {
    mockJsonResponse({ code: 'NoRoute', message: 'Impossible route' }, NO_ROUTE_STATUS);

    await expect(buildService().getRoute(FROM, TO)).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
  });

  it('should throw ServiceUnavailableException when the request fails', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'));

    await expect(buildService().getRoute(FROM, TO)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('should throw ServiceUnavailableException when the answer is not JSON', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockImplementation(() => Promise.resolve(new Response('<html>502</html>', { status: 502 })));

    await expect(buildService().getRoute(FROM, TO)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('should throw ServiceUnavailableException when OSRM returns an unexpected code', async () => {
    mockJsonResponse({ code: 'InvalidQuery' }, NO_ROUTE_STATUS);

    await expect(buildService().getRoute(FROM, TO)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('should throw ServiceUnavailableException when Ok comes without routes', async () => {
    mockJsonResponse({ code: 'Ok', routes: [] });

    await expect(buildService().getRoute(FROM, TO)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
