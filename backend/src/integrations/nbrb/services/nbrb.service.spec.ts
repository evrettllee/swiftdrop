import { Logger, ServiceUnavailableException } from '@nestjs/common';
import { MS_PER_MINUTE } from '@/common/constants/time.constants';
import {
  NBRB_CACHE_TTL_MS,
  NBRB_RATE_CURRENCY,
  NBRB_RETRY_DELAY_MS,
} from '../constants/nbrb.constants';
import type { NbrbClient } from './nbrb-client.service';
import { NbrbService } from './nbrb.service';
import type { SavedRateService } from './saved-rate.service';

const FRESH_RATE = 3.0371;
const SAVED_RATE = 2.9876;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const START = Date.UTC(2026, 10, 11, 9);

describe('NbrbService', () => {
  let service: NbrbService;
  let now: number;
  let warn: jest.SpiedFunction<Logger['warn']>;
  const fetchUsdRate = jest.fn<Promise<number>, []>();
  const find = jest.fn<
    ReturnType<SavedRateService['find']>,
    Parameters<SavedRateService['find']>
  >();
  const save = jest.fn<
    ReturnType<SavedRateService['save']>,
    Parameters<SavedRateService['save']>
  >();

  function saveRateHoursAgo(hours: number): void {
    find.mockResolvedValue({ rate: SAVED_RATE, fetchedAt: new Date(now - hours * MS_PER_HOUR) });
  }

  function failNbrb(): void {
    fetchUsdRate.mockRejectedValue(new Error('NBRB is down'));
  }

  beforeEach(() => {
    now = START;
    jest.spyOn(Date, 'now').mockImplementation(() => now);
    warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    fetchUsdRate.mockReset().mockResolvedValue(FRESH_RATE);
    find.mockReset().mockResolvedValue(null);
    save.mockReset().mockResolvedValue(undefined);
    service = new NbrbService(
      { fetchUsdRate } as unknown as NbrbClient,
      { find, save } as unknown as SavedRateService,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return the fresh NBRB rate and save it', async () => {
    expect(await service.getUsdRate()).toBe(FRESH_RATE);
    expect(save).toHaveBeenCalledWith(NBRB_RATE_CURRENCY, {
      rate: FRESH_RATE,
      fetchedAt: new Date(START),
    });
    expect(find).not.toHaveBeenCalled();
  });

  it('should ask NBRB once within the cache time and again after it', async () => {
    await service.getUsdRate();
    await service.getUsdRate();
    now += NBRB_CACHE_TTL_MS + 1;
    await service.getUsdRate();

    expect(fetchUsdRate).toHaveBeenCalledTimes(2);
  });

  it('should use the saved rate of 71 hours with a warning when NBRB fails', async () => {
    failNbrb();
    saveRateHoursAgo(71);

    expect(await service.getUsdRate()).toBe(SAVED_RATE);
    expect(find).toHaveBeenCalledWith(NBRB_RATE_CURRENCY);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Using the saved NBRB rate'));
  });

  it('should throw 503 when NBRB fails and the saved rate is 73 hours old', async () => {
    failNbrb();
    saveRateHoursAgo(73);

    await expect(service.getUsdRate()).rejects.toThrow(ServiceUnavailableException);
  });

  it('should throw 503 on the first start when NBRB fails and no rate is saved', async () => {
    failNbrb();

    await expect(service.getUsdRate()).rejects.toThrow(ServiceUnavailableException);
  });

  it('should keep the saved rate until the retry delay and then ask NBRB again', async () => {
    failNbrb();
    saveRateHoursAgo(1);
    await service.getUsdRate();
    await service.getUsdRate();

    expect(fetchUsdRate).toHaveBeenCalledTimes(1);

    now += NBRB_RETRY_DELAY_MS + 1;
    fetchUsdRate.mockResolvedValue(FRESH_RATE);

    expect(await service.getUsdRate()).toBe(FRESH_RATE);
    expect(fetchUsdRate).toHaveBeenCalledTimes(2);
  });

  it('should ask NBRB again on the next call after a failure with no rate', async () => {
    failNbrb();
    await expect(service.getUsdRate()).rejects.toThrow(ServiceUnavailableException);
    fetchUsdRate.mockResolvedValue(FRESH_RATE);

    expect(await service.getUsdRate()).toBe(FRESH_RATE);
  });

  it('should use the rate in memory when NBRB fails and the saved rate cannot be read', async () => {
    await service.getUsdRate();
    now += NBRB_CACHE_TTL_MS + 1;
    failNbrb();
    find.mockRejectedValue(new Error('database is down'));

    expect(await service.getUsdRate()).toBe(FRESH_RATE);
  });

  it('should return the fresh rate when it cannot be saved', async () => {
    save.mockRejectedValue(new Error('database is down'));

    expect(await service.getUsdRate()).toBe(FRESH_RATE);
  });
});
