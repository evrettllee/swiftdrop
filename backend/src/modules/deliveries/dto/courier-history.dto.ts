import { z } from 'zod';
import {
  DELIVERIES_VALIDATION_MESSAGES,
  HISTORY_FIRST_PAGE,
  HISTORY_PAGE_SIZE_DEFAULT,
  HISTORY_PAGE_SIZE_MAX,
  HISTORY_PAGE_SIZE_MIN,
} from '../constants/deliveries.constants';

const pageError = DELIVERIES_VALIDATION_MESSAGES.PAGE_INVALID;
const limitError = DELIVERIES_VALIDATION_MESSAGES.LIMIT_INVALID;

// Query values arrive as strings, so numbers are coerced.
export const courierHistorySchema = z.object({
  page: z.coerce
    .number({ error: pageError })
    .int({ error: pageError })
    .min(HISTORY_FIRST_PAGE, { error: pageError })
    .default(HISTORY_FIRST_PAGE),
  limit: z.coerce
    .number({ error: limitError })
    .int({ error: limitError })
    .min(HISTORY_PAGE_SIZE_MIN, { error: limitError })
    .max(HISTORY_PAGE_SIZE_MAX, { error: limitError })
    .default(HISTORY_PAGE_SIZE_DEFAULT),
});

export type CourierHistoryDto = z.infer<typeof courierHistorySchema>;
