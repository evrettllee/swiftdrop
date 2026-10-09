import { z } from 'zod';
import { ORDER_ID_INVALID_MESSAGE } from '../../common/constants/orders.constants';

export const createPaymentSchema = z.object({
  orderId: z
    .number({ error: ORDER_ID_INVALID_MESSAGE })
    .int(ORDER_ID_INVALID_MESSAGE)
    .positive(ORDER_ID_INVALID_MESSAGE),
});

export type CreatePaymentDto = z.infer<typeof createPaymentSchema>;
