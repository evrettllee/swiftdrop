import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { describeError } from '@/common/utils/describe-error';
import {
  NBRB_CACHE_TTL_MS,
  NBRB_ERROR_MESSAGES,
  NBRB_RATE_CURRENCY,
  NBRB_RETRY_DELAY_MS,
  NBRB_SAVED_RATE_MAX_AGE_MS,
} from '../constants/nbrb.constants';
import type { KnownRate } from '../types/nbrb.types';
import { NbrbClient } from './nbrb-client.service';
import { SavedRateService } from './saved-rate.service';

function pickLatest(first: KnownRate | null, second: KnownRate | null): KnownRate | null {
  if (first === null || second === null) {
    return first ?? second;
  }

  return first.fetchedAt >= second.fetchedAt ? first : second;
}

@Injectable()
export class NbrbService {
  private readonly logger = new Logger(NbrbService.name);
  private known: KnownRate | null = null;
  private refreshAfter = 0;

  constructor(
    private readonly client: NbrbClient,
    private readonly savedRates: SavedRateService,
  ) {}

  async getUsdRate(): Promise<number> {
    if (this.known !== null && Date.now() < this.refreshAfter) {
      return this.known.rate;
    }

    return this.refresh();
  }

  private async refresh(): Promise<number> {
    const now = Date.now();

    try {
      const rate = await this.client.fetchUsdRate();
      this.remember({ rate, fetchedAt: new Date(now) }, now + NBRB_CACHE_TTL_MS);
      await this.save({ rate, fetchedAt: new Date(now) });

      return rate;
    } catch (error) {
      this.logger.warn(`NBRB rate request failed: ${describeError(error)}`);
    }

    return this.fallBack(now);
  }

  private async fallBack(now: number): Promise<number> {
    const latest = pickLatest(await this.findSaved(), this.known);
    const expiresAt =
      latest === null ? now : latest.fetchedAt.getTime() + NBRB_SAVED_RATE_MAX_AGE_MS;

    if (latest === null || expiresAt < now) {
      throw new ServiceUnavailableException(NBRB_ERROR_MESSAGES.RATE_UNAVAILABLE);
    }

    this.logger.warn(`Using the saved NBRB rate fetched at ${latest.fetchedAt.toISOString()}`);
    this.remember(latest, Math.min(now + NBRB_RETRY_DELAY_MS, expiresAt));

    return latest.rate;
  }

  private remember(rate: KnownRate, refreshAfter: number): void {
    this.known = rate;
    this.refreshAfter = refreshAfter;
  }

  private async findSaved(): Promise<KnownRate | null> {
    try {
      return await this.savedRates.find(NBRB_RATE_CURRENCY);
    } catch (error) {
      this.logger.warn(`Saved NBRB rate could not be read: ${describeError(error)}`);

      return null;
    }
  }

  private async save(rate: KnownRate): Promise<void> {
    try {
      await this.savedRates.save(NBRB_RATE_CURRENCY, rate);
    } catch (error) {
      this.logger.warn(`NBRB rate could not be saved: ${describeError(error)}`);
    }
  }
}
