import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { describeError } from '../../../common/utils/describe-error';
import { nbrbRateSchema } from '../schemas/nbrb-rate.schema';
import {
  NBRB_CACHE_TTL_MS,
  NBRB_ERROR_MESSAGES,
  NBRB_REQUEST_TIMEOUT_MS,
  NBRB_RETRY_DELAY_MS,
  NBRB_USD_RATE_URL,
} from '../constants/nbrb.constants';

@Injectable()
export class NbrbService {
  private readonly logger = new Logger(NbrbService.name);
  private cachedRate: number | null = null;
  private refreshAfter = 0;

  // BYN for one US dollar.
  async getUsdRate(): Promise<number> {
    let rate = Date.now() < this.refreshAfter ? this.cachedRate : null;

    if (rate === null) {
      rate = await this.refresh();
    }

    return rate;
  }

  private async refresh(): Promise<number> {
    const now = Date.now();
    let rate: number | null;

    try {
      rate = await this.fetchRate();
      this.cachedRate = rate;
      this.refreshAfter = now + NBRB_CACHE_TTL_MS;
    } catch (error) {
      this.logger.warn(`NBRB rate request failed: ${describeError(error)}`);
      // The last known rate is better than no payments at all.
      rate = this.cachedRate;
      this.refreshAfter = now + NBRB_RETRY_DELAY_MS;
    }

    if (rate === null) {
      throw new ServiceUnavailableException(NBRB_ERROR_MESSAGES.RATE_UNAVAILABLE);
    }

    return rate;
  }

  private async fetchRate(): Promise<number> {
    const response = await fetch(NBRB_USD_RATE_URL, {
      signal: AbortSignal.timeout(NBRB_REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`NBRB answered with status ${response.status}`);
    }

    const { Cur_OfficialRate: officialRate, Cur_Scale: scale } = nbrbRateSchema.parse(
      await response.json(),
    );

    return officialRate / scale;
  }
}
