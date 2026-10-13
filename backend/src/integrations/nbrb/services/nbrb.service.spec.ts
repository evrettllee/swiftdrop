import { ServiceUnavailableException } from '@nestjs/common';
import { NBRB_CACHE_TTL_MS } from '../constants/nbrb.constants';
import { NbrbService } from './nbrb.service';

const RATE_BODY = { Cur_Scale: 1, Cur_OfficialRate: 3.0371 };

function buildResponse(body: unknown, status = 200): Response {
  return { ok: status === 200, status, json: () => Promise.resolve(body) } as unknown as Response;
}

describe('NbrbService', () => {
  let service: NbrbService;
  let fetchMock: jest.SpiedFunction<typeof globalThis.fetch>;
  let now: number;

  beforeEach(() => {
    service = new NbrbService();
    now = 1_000_000;
    jest.spyOn(Date, 'now').mockImplementation(() => now);
    fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(buildResponse(RATE_BODY));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return the official rate when NBRB answers', async () => {
    expect(await service.getUsdRate()).toBe(3.0371);
  });

  it('should divide the rate by the scale when the rate is given for several units', async () => {
    fetchMock.mockResolvedValue(buildResponse({ Cur_Scale: 100, Cur_OfficialRate: 303.71 }));

    expect(await service.getUsdRate()).toBeCloseTo(3.0371, 4);
  });

  it('should ask NBRB once when the rate is requested twice within the cache time', async () => {
    await service.getUsdRate();
    await service.getUsdRate();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('should ask NBRB again when the cache time has passed', async () => {
    await service.getUsdRate();
    now += NBRB_CACHE_TTL_MS + 1;
    await service.getUsdRate();

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('should return the last known rate when NBRB fails after a successful request', async () => {
    await service.getUsdRate();
    now += NBRB_CACHE_TTL_MS + 1;
    fetchMock.mockRejectedValue(new Error('NBRB is down'));

    expect(await service.getUsdRate()).toBe(3.0371);
  });

  it('should throw 503 when NBRB fails and no rate is known yet', async () => {
    fetchMock.mockRejectedValue(new Error('NBRB is down'));

    await expect(service.getUsdRate()).rejects.toThrow(ServiceUnavailableException);
  });

  it('should throw 503 when NBRB answers with an error status and no rate is known', async () => {
    fetchMock.mockResolvedValue(buildResponse({}, 500));

    await expect(service.getUsdRate()).rejects.toThrow(ServiceUnavailableException);
  });

  it('should throw 503 when the NBRB answer has no usable rate', async () => {
    fetchMock.mockResolvedValue(buildResponse({ Cur_Scale: 1 }));

    await expect(service.getUsdRate()).rejects.toThrow(ServiceUnavailableException);
  });
});
