import { Logger, ServiceUnavailableException, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ServiceFailuresService } from '@/modules/service-failures/services/service-failures.service';
import { OsrmClient } from './osrm-client.service';
import { OsrmService } from './osrm.service';

const FROM = { latitude: 53.9006, longitude: 27.559 };
const TO = { latitude: 53.9075, longitude: 27.457 };

describe('OsrmClient failures', () => {
  const record = jest.fn<Promise<void>, unknown[]>();
  let service: OsrmService;

  function answer(body: string, status = 200): void {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(body, { status }));
  }

  function failWith(error: unknown): void {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(error);
  }

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    record.mockReset().mockResolvedValue(undefined);
    const failures = { record } as unknown as ServiceFailuresService;
    service = new OsrmService(
      new OsrmClient(new ConfigService({ OSRM_URL: 'https://osrm.test' }), failures),
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should record a timeout', async () => {
    failWith(Object.assign(new Error('aborted'), { name: 'TimeoutError' }));

    await expect(service.getRoute(FROM, TO)).rejects.toThrow(ServiceUnavailableException);
    expect(record).toHaveBeenCalledWith('osrm', 'timeout', 'Нет ответа за 5 с');
  });

  it('should record a network error by its code and a 5xx answer by its status', async () => {
    failWith(new TypeError('fetch failed', { cause: { code: 'ECONNREFUSED' } }));
    await expect(service.getRoute(FROM, TO)).rejects.toThrow(ServiceUnavailableException);

    answer('<html>Service Unavailable</html>', 503);
    await expect(service.getRoute(FROM, TO)).rejects.toThrow(ServiceUnavailableException);

    expect(record.mock.calls).toEqual([
      ['osrm', 'unavailable', 'ECONNREFUSED'],
      ['osrm', 'unavailable', 'HTTP 503'],
    ]);
  });

  it('should record an answer that cannot be read or has no route', async () => {
    answer('not json');
    await expect(service.getRoute(FROM, TO)).rejects.toThrow(ServiceUnavailableException);

    answer(JSON.stringify({ code: 'Ok', routes: [] }));
    await expect(service.getRoute(FROM, TO)).rejects.toThrow(ServiceUnavailableException);

    answer(JSON.stringify({ routes: 'none' }));
    await expect(service.getRoute(FROM, TO)).rejects.toThrow(ServiceUnavailableException);

    expect(record.mock.calls.map(([, code, message]) => [code, message])).toEqual([
      ['bad_response', 'Ответ не в формате JSON'],
      ['bad_response', 'В ответе нет маршрута'],
      ['bad_response', 'Ответ не по схеме'],
    ]);
  });

  it('should not record a missing route or a paused service', async () => {
    answer(JSON.stringify({ code: 'NoRoute', message: 'Impossible route' }), 400);
    await expect(service.getRoute(FROM, TO)).rejects.toThrow(UnprocessableEntityException);

    failWith(new TypeError('fetch failed'));
    for (let attempt = 0; attempt < 4; attempt += 1) {
      await expect(service.getRoute(FROM, TO)).rejects.toThrow(ServiceUnavailableException);
    }

    expect(record).toHaveBeenCalledTimes(3);
    expect(JSON.stringify(record.mock.calls)).not.toMatch(/27\.559|53\.90|osrm\.test/);
  });
});
