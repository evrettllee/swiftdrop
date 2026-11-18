import { Logger, ServiceUnavailableException } from '@nestjs/common';
import type { ServiceFailuresService } from '@/modules/service-failures/services/service-failures.service';
import { NBRB_CACHE_TTL_MS, NBRB_RETRY_DELAY_MS } from '../constants/nbrb.constants';
import type { NbrbClient } from './nbrb-client.service';
import { NbrbService } from './nbrb.service';
import type { SavedRateService } from './saved-rate.service';

const START = Date.UTC(2026, 10, 11, 9);
const SAVED_AT = new Date('2026-11-08T22:30:00Z');

describe('NbrbService saved rate failures', () => {
  let service: NbrbService;
  let now: number;
  const fetchUsdRate = jest.fn<Promise<number>, []>();
  const find = jest.fn<ReturnType<SavedRateService['find']>, []>();
  const record = jest.fn<Promise<void>, unknown[]>();

  beforeEach(() => {
    now = START;
    jest.spyOn(Date, 'now').mockImplementation(() => now);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    fetchUsdRate.mockReset().mockRejectedValue(new Error('NBRB is down'));
    find.mockReset().mockResolvedValue({ rate: 2.9876, fetchedAt: SAVED_AT });
    record.mockReset().mockResolvedValue(undefined);
    service = new NbrbService(
      { fetchUsdRate } as unknown as NbrbClient,
      { find, save: () => Promise.resolve() } as unknown as SavedRateService,
      { record } as unknown as ServiceFailuresService,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should record every payment that uses the saved rate with its Minsk date only', async () => {
    await service.getUsdRate();
    await service.getUsdRate();
    now += NBRB_RETRY_DELAY_MS + 1;
    await service.getUsdRate();

    expect(record.mock.calls).toEqual([
      ['nbrb', 'saved_rate_used', 'Курс от 09.11.2026'],
      ['nbrb', 'saved_rate_used', 'Курс от 09.11.2026'],
      ['nbrb', 'saved_rate_used', 'Курс от 09.11.2026'],
    ]);
  });

  it('should stop recording once NBRB answers again', async () => {
    await service.getUsdRate();
    fetchUsdRate.mockResolvedValue(3.0371);
    now += NBRB_RETRY_DELAY_MS + 1;
    await service.getUsdRate();
    now += NBRB_CACHE_TTL_MS - 1;
    await service.getUsdRate();

    expect(record).toHaveBeenCalledTimes(1);
  });

  it('should record nothing more when there is no usable saved rate', async () => {
    find.mockResolvedValue(null);

    await expect(service.getUsdRate()).rejects.toThrow(ServiceUnavailableException);
    expect(record).not.toHaveBeenCalled();
  });
});
