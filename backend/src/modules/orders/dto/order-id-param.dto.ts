import { z } from 'zod';
import { DB_INTEGER_MAX } from '@/common/constants/database.constants';
import { ORDERS_VALIDATION_MESSAGES } from '../constants/orders.constants';

// Route params arrive as strings, so the id is coerced.
export const orderIdParamSchema = z.object({
  orderId: z.coerce
    .number({ error: ORDERS_VALIDATION_MESSAGES.ORDER_ID_INVALID })
    .int(ORDERS_VALIDATION_MESSAGES.ORDER_ID_INVALID)
    .positive(ORDERS_VALIDATION_MESSAGES.ORDER_ID_INVALID)
    .max(DB_INTEGER_MAX, ORDERS_VALIDATION_MESSAGES.ORDER_ID_INVALID),
});

export type OrderIdParamDto = z.infer<typeof orderIdParamSchema>;
