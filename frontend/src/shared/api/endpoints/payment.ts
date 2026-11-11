import { z } from 'zod';
import { http } from '../http';

export const PAYMENTS_API_PATHS = {
  PAYMENTS: '/payments',
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

const CHECKOUT_PROTOCOL = /^https$/;

// Response of POST /api/payments
export const startedPaymentSchema = z.object({
  paymentId: z.number(),
  checkoutUrl: z.url({ protocol: CHECKOUT_PROTOCOL }),
});

export type StartedPayment = z.infer<typeof startedPaymentSchema>;

// Starts a payment attempt: the client then goes to `checkoutUrl` to pay.
export async function startPayment(orderId: number): Promise<StartedPayment> {
  return startedPaymentSchema.parse(await http.post(PAYMENTS_API_PATHS.PAYMENTS, { orderId }));
}
