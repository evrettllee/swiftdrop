import { Logger, ServiceUnavailableException, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MS_PER_SECOND } from '@/common/constants/time.constants';
import {
  OSRM_COOLDOWN_MS,
  OSRM_FAILURE_THRESHOLD,
  OSRM_UNAVAILABLE_MESSAGE,
} from '../constants/osrm.constants';
import { OsrmClient } from './osrm-client.service';
import { OsrmService } from './osrm.service';

const FROM = { latitude: 53.9006, longitude: 27.559 };
const TO = { latitude: 53.9075, longitude: 27.457 };
const START_MS = 1_000_000;
const NO_ROUTE_STATUS = 400;
const okBody = { code: 'Ok', routes: [{ distance: 6300, duration: 420.5 }] };

function jsonResponse(body: unknown, status = 200): Promise<Response> {
  return Promise.resolve(new Response(JSON.stringify(body), { status }));
}

describe('OsrmService circuit breaker', () => {
  let service: OsrmService;
  let fetchSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  async function failTimes(times: number): Promise<void> {
    for (let index = 0; index < times; index += 1) {
      await expect(service.getRoute(FROM, TO)).rejects.toBeInstanceOf(ServiceUnavailableException);
    }
  }

  beforeEach(() => {
    service = new OsrmService(new OsrmClient(new ConfigService({ OSRM_URL: 'https://osrm.test' })));
    jest.spyOn(Date, 'now').mockReturnValue(START_MS);
    fetchSpy = jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'));
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should fail at once without a request after the failures limit', async () => {
    await failTimes(OSRM_FAILURE_THRESHOLD);
    fetchSpy.mockClear();
    errorSpy.mockClear();

    await expect(service.getRoute(FROM, TO)).rejects.toThrow(
      new ServiceUnavailableException(OSRM_UNAVAILABLE_MESSAGE),
    );
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(service.isAvailable()).toBe(false);
  });

  it('should warn once with the pause when it opens', async () => {
    await failTimes(OSRM_FAILURE_THRESHOLD + 2);

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(`${OSRM_COOLDOWN_MS / MS_PER_SECOND} s`),
    );
  });

  it('should request again after the pause and log the recovery once', async () => {
    await failTimes(OSRM_FAILURE_THRESHOLD);
    jest.spyOn(Date, 'now').mockReturnValue(START_MS + OSRM_COOLDOWN_MS);
    fetchSpy.mockClear();
    fetchSpy.mockImplementation(() => jsonResponse(okBody));

    await expect(service.getRoute(FROM, TO)).resolves.toMatchObject({ durationSec: 420.5 });
    await service.getRoute(FROM, TO);

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(service.isAvailable()).toBe(true);
  });

  it('should pause again when the trial after the pause fails', async () => {
    await failTimes(OSRM_FAILURE_THRESHOLD);
    jest.spyOn(Date, 'now').mockReturnValue(START_MS + OSRM_COOLDOWN_MS);

    await failTimes(1);

    expect(service.isAvailable()).toBe(false);
    expect(warnSpy).toHaveBeenCalledTimes(2);
  });

  it('should not count a missing route as a failure', async () => {
    fetchSpy.mockImplementation(() => jsonResponse({ code: 'NoRoute' }, NO_ROUTE_STATUS));

    for (let index = 0; index < OSRM_FAILURE_THRESHOLD + 1; index += 1) {
      await expect(service.getRoute(FROM, TO)).rejects.toBeInstanceOf(UnprocessableEntityException);
    }

    expect(fetchSpy).toHaveBeenCalledTimes(OSRM_FAILURE_THRESHOLD + 1);
    expect(service.isAvailable()).toBe(true);
  });

  it('should start the count anew after a successful answer', async () => {
    await failTimes(OSRM_FAILURE_THRESHOLD - 1);
    fetchSpy.mockImplementationOnce(() => jsonResponse(okBody));
    await service.getRoute(FROM, TO);

    await failTimes(OSRM_FAILURE_THRESHOLD - 1);

    expect(service.isAvailable()).toBe(true);
  });
});
