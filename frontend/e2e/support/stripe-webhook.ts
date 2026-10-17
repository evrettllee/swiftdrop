import { createHmac, randomUUID } from 'node:crypto';
import { type APIRequestContext, expect } from '@playwright/test';
import { PAYMENTS_API_PATHS } from '../../src/shared/api/endpoints/payment';
import { API_BASE_PATH } from '../../src/shared/api/request-config';

const WEBHOOK_URL = `${API_BASE_PATH}${PAYMENTS_API_PATHS.PAYMENTS}/webhook`;
const SIGNATURE_HEADER = 'stripe-signature';
const MS_PER_SECOND = 1000;
const WEBHOOK_SECRET = process.env.E2E_STRIPE_WEBHOOK_SECRET ?? '';

// The signing secret of the webhook of the backend, given to the tests through the environment.
export function hasWebhookSecret(): boolean {
  return WEBHOOK_SECRET !== '';
}

// The notification Stripe sends when the client has paid the Checkout Session of an order.
function buildPaidEvent(orderId: number, sessionId: string): string {
  return JSON.stringify({
    id: `evt_e2e_${randomUUID()}`,
    object: 'event',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: sessionId,
        object: 'checkout.session',
        status: 'complete',
        payment_status: 'paid',
        payment_intent: `pi_e2e_${randomUUID()}`,
        metadata: { orderId: String(orderId) },
      },
    },
  });
}

// The header Stripe signs the raw body with: the time and HMAC-SHA256 of "<time>.<body>".
function sign(body: string): string {
  const timestamp = Math.floor(Date.now() / MS_PER_SECOND);
  const signature = createHmac('sha256', WEBHOOK_SECRET)
    .update(`${timestamp}.${body}`)
    .digest('hex');

  return `t=${timestamp},v1=${signature}`;
}

// Pays the order the way Stripe does: a signed notification to the real webhook of the backend.
export async function payOrder(
  request: APIRequestContext,
  orderId: number,
  sessionId: string,
): Promise<void> {
  const body = buildPaidEvent(orderId, sessionId);
  const response = await request.post(WEBHOOK_URL, {
    headers: { 'content-type': 'application/json', [SIGNATURE_HEADER]: sign(body) },
    data: body,
  });

  // The status only: the answer and the request carry no secret, but nothing needs printing.
  expect(response.status(), 'The webhook of the backend accepted the payment').toBe(200);
}
