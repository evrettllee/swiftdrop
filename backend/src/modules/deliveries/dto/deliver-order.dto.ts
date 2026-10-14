import { z } from 'zod';
import {
  DELIVERIES_VALIDATION_MESSAGES,
  DELIVERY_CODE_PATTERN,
} from '../constants/deliveries.constants';

export const deliverOrderSchema = z.object({
  code: z
    .string({ error: DELIVERIES_VALIDATION_MESSAGES.CODE_INVALID })
    .regex(DELIVERY_CODE_PATTERN, { error: DELIVERIES_VALIDATION_MESSAGES.CODE_INVALID }),
});

export type DeliverOrderDto = z.infer<typeof deliverOrderSchema>;
