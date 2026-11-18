import { Injectable } from '@nestjs/common';
import { SERVICE_NAME } from '@/common/enums/service-name.enum';
import { describeError } from '@/common/utils/describe-error';
import { FAILURE_MESSAGES } from '@/modules/service-failures/constants/service-failures.constants';
import { ServiceFailuresService } from '@/modules/service-failures/services/service-failures.service';
import {
  badResponseFailure,
  type Failure,
  type FetchFailureCode,
  fetchFailureOf,
  httpStatusFailure,
  isTimeoutError,
} from '@/modules/service-failures/utils/failure-message';
import { nbrbRateSchema } from '../schemas/nbrb-rate.schema';
import { NBRB_REQUEST_TIMEOUT_MS, NBRB_USD_RATE_URL } from '../constants/nbrb.constants';

@Injectable()
export class NbrbClient {
  constructor(private readonly failures: ServiceFailuresService) {}

  async fetchUsdRate(): Promise<number> {
    let response: Response;

    try {
      response = await fetch(NBRB_USD_RATE_URL, {
        signal: AbortSignal.timeout(NBRB_REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      throw this.failed(fetchFailureOf(error, NBRB_REQUEST_TIMEOUT_MS), error);
    }

    if (!response.ok) {
      throw this.failed(
        httpStatusFailure(response.status),
        new Error(`NBRB answered with status ${response.status}`),
      );
    }

    let payload: unknown;

    try {
      payload = await response.json();
    } catch (error) {
      const failure = isTimeoutError(error)
        ? fetchFailureOf(error, NBRB_REQUEST_TIMEOUT_MS)
        : badResponseFailure(FAILURE_MESSAGES.NOT_JSON);

      throw this.failed(failure, error);
    }

    const parsed = nbrbRateSchema.safeParse(payload);

    if (!parsed.success) {
      throw this.failed(badResponseFailure(FAILURE_MESSAGES.BAD_SHAPE), parsed.error);
    }

    return parsed.data.Cur_OfficialRate / parsed.data.Cur_Scale;
  }

  private failed(failure: Failure<FetchFailureCode>, error: unknown): Error {
    void this.failures.record(SERVICE_NAME.NBRB, failure.code, failure.message);

    return error instanceof Error ? error : new Error(describeError(error));
  }
}
