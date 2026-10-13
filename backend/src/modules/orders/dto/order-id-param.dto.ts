import { z } from 'zod';
import { ORDERS_VALIDATION_MESSAGES } from '../constants/orders.constants';

// Route params arrive as strings, so the id is coerced.
export const orderIdParamSchema = z.object({
  orderId: z.coerce
    .number({ error: ORDERS_VALIDATION_MESSAGES.ORDER_ID_INVALID })
    .int(ORDERS_VALIDATION_MESSAGES.ORDER_ID_INVALID)
    .positive(ORDERS_VALIDATION_MESSAGES.ORDER_ID_INVALID),
});

export type OrderIdParamDto = z.infer<typeof orderIdParamSchema>;
