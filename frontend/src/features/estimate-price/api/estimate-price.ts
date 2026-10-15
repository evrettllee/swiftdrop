import {
  ApiError,
  http,
  type HttpOptions,
  type PriceEstimate,
  priceEstimateSchema,
} from '@/shared/api';
import { PRICING_API_PATHS } from '../config/estimate';
import { ESTIMATE_STATUS_MESSAGES } from '../config/texts';
import type { EstimateInput } from '../model/estimate-input';

// A failed request becomes an ApiError whose message can be shown to the user as it is.
function toEstimateError(error: unknown): unknown {
  if (!(error instanceof ApiError)) {
    return error;
  }

  const message = ESTIMATE_STATUS_MESSAGES[error.status];

  return message === undefined ? error : new ApiError(error.status, message, error.fieldErrors);
}

export async function estimatePrice(
  input: EstimateInput,
  options: HttpOptions = {},
): Promise<PriceEstimate> {
  try {
    return priceEstimateSchema.parse(
      await http.post(PRICING_API_PATHS.ESTIMATES, input, options),
    );
  } catch (error) {
    throw toEstimateError(error);
  }
}
