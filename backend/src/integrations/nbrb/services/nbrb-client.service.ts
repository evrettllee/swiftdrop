import { Injectable } from '@nestjs/common';
import { nbrbRateSchema } from '../schemas/nbrb-rate.schema';
import { NBRB_REQUEST_TIMEOUT_MS, NBRB_USD_RATE_URL } from '../constants/nbrb.constants';

@Injectable()
export class NbrbClient {
  async fetchUsdRate(): Promise<number> {
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
