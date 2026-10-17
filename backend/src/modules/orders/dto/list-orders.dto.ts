import { z } from 'zod';
import {
  ORDER_LIST_FILTER,
  ORDER_LIST_FILTER_VALUES,
  ORDERS_FIRST_PAGE,
  ORDERS_PAGE_SIZE_DEFAULT,
  ORDERS_PAGE_SIZE_MAX,
  ORDERS_PAGE_SIZE_MIN,
  ORDERS_VALIDATION_MESSAGES,
} from '../constants/orders.constants';

// Query values arrive as strings, so numbers are coerced.
export const listOrdersSchema = z.object({
  page: z.coerce
    .number({ error: ORDERS_VALIDATION_MESSAGES.PAGE_INVALID })
    .int(ORDERS_VALIDATION_MESSAGES.PAGE_INVALID)
    .min(ORDERS_FIRST_PAGE, ORDERS_VALIDATION_MESSAGES.PAGE_INVALID)
    .default(ORDERS_FIRST_PAGE),
  limit: z.coerce
    .number({ error: ORDERS_VALIDATION_MESSAGES.LIMIT_INVALID })
    .int(ORDERS_VALIDATION_MESSAGES.LIMIT_INVALID)
    .min(ORDERS_PAGE_SIZE_MIN, ORDERS_VALIDATION_MESSAGES.LIMIT_INVALID)
    .max(ORDERS_PAGE_SIZE_MAX, ORDERS_VALIDATION_MESSAGES.LIMIT_INVALID)
    .default(ORDERS_PAGE_SIZE_DEFAULT),
  filter: z
    .enum(ORDER_LIST_FILTER_VALUES, { error: ORDERS_VALIDATION_MESSAGES.FILTER_INVALID })
    .default(ORDER_LIST_FILTER.ALL),
});

export type ListOrdersDto = z.infer<typeof listOrdersSchema>;
