import { z } from 'zod';
import { unknownParameterError } from '@/common/schemas/list-query.schema';
import {
  COURIER_LOOKUP_LIMIT_DEFAULT,
  COURIER_LOOKUP_LIMIT_MAX,
  COURIER_LOOKUP_LIMIT_MIN,
  COURIER_LOOKUP_MESSAGES,
} from '../constants/manager-courier-lookup.constants';
import { managerSearchSchema } from './manager-orders.dto';

const limitError = { error: COURIER_LOOKUP_MESSAGES.LIMIT_INVALID };

export const courierLookupSchema = z
  .strictObject(
    {
      q: managerSearchSchema.optional(),
      limit: z.coerce
        .number(limitError)
        .int(limitError)
        .min(COURIER_LOOKUP_LIMIT_MIN, limitError)
        .max(COURIER_LOOKUP_LIMIT_MAX, limitError)
        .default(COURIER_LOOKUP_LIMIT_DEFAULT),
    },
    { error: unknownParameterError },
  )
  .transform(({ q, limit }) => ({ search: q ?? null, limit }));

export type CourierLookupDto = z.infer<typeof courierLookupSchema>;
