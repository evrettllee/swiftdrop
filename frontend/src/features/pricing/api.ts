import { ApiError, http } from '../../shared/api/http';
import { ESTIMATE_STATUS_MESSAGES, PRICING_API_PATHS } from './constants/estimate';
import { type PriceEstimate, priceEstimateSchema } from './schemas';
import type { EstimateInput } from './types';

// A failed request becomes an ApiError whose message can be shown to the user as it is.
function toEstimateError(error: unknown): unknown {
  if (!(error instanceof ApiError)) {
    return error;
  }

  const message = ESTIMATE_STATUS_MESSAGES[error.status];

  return message === undefined ? error : new ApiError(error.status, message, error.fieldErrors);
}

export async function estimatePrice(input: EstimateInput): Promise<PriceEstimate> {
  try {
    return priceEstimateSchema.parse(await http.post(PRICING_API_PATHS.ESTIMATES, input));
  } catch (error) {
    throw toEstimateError(error);
  }
}
