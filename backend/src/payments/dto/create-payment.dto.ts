import { z } from 'zod';
import { ORDERS_VALIDATION_MESSAGES } from '../../orders/orders.constants';

export const createPaymentSchema = z.object({
  orderId: z
    .number({ error: ORDERS_VALIDATION_MESSAGES.ORDER_ID_INVALID })
    .int(ORDERS_VALIDATION_MESSAGES.ORDER_ID_INVALID)
    .positive(ORDERS_VALIDATION_MESSAGES.ORDER_ID_INVALID),
});

export type CreatePaymentDto = z.infer<typeof createPaymentSchema>;
