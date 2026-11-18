import { BadRequestException, Logger, ServiceUnavailableException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import type { ServiceFailuresService } from '@/modules/service-failures/services/service-failures.service';
import type { StripeCheckoutApi } from '../contracts/stripe-checkout.contract';
import { StripePaymentAdapter } from './stripe-payment.adapter';

const config = { getOrThrow: () => 'whsec_swiftdrop_unit_only' } as unknown as ConfigService;
const PAYMENT_INTENT = 'pi_3PqRsTuVwXyZ012345';

describe('StripePaymentAdapter failures', () => {
  const record = jest.fn<Promise<void>, unknown[]>();
  const client = {
    createRefund: jest.fn<Promise<void>, [string, string]>(),
    expireSession: jest.fn<Promise<void>, [string]>(),
  };
  let adapter: StripePaymentAdapter;

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    record.mockReset().mockResolvedValue(undefined);
    adapter = new StripePaymentAdapter(client as unknown as StripeCheckoutApi, config, {
      record,
    } as unknown as ServiceFailuresService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should record a failed refund by the error type and code only', async () => {
    client.createRefund.mockRejectedValue(
      new Stripe.errors.StripeAPIError({
        type: 'api_error',
        code: 'lock_timeout',
        message: `Refund of ${PAYMENT_INTENT} failed`,
      }),
    );

    await expect(adapter.refund(PAYMENT_INTENT)).rejects.toThrow(ServiceUnavailableException);
    expect(record).toHaveBeenCalledWith('stripe', 'api_error', 'api_error lock_timeout');
    expect(JSON.stringify(record.mock.calls)).not.toContain(PAYMENT_INTENT);
  });

  it('should not record closing a session that is no longer open', async () => {
    client.expireSession.mockRejectedValue(
      new Stripe.errors.StripeInvalidRequestError({
        type: 'invalid_request_error',
        statusCode: 400,
        message: 'Session is not open',
      }),
    );

    await adapter.expireCheckoutSession('cs_test_a1B2c3D4e5F6g7H8');
    expect(record).not.toHaveBeenCalled();
  });

  it('should record a webhook with a bad signature', () => {
    expect(() => adapter.parseWebhook(Buffer.from('{}'), 't=1,v1=bad')).toThrow(
      BadRequestException,
    );
    expect(record).toHaveBeenCalledWith('stripe', 'webhook_bad_signature', 'Неверная подпись');
  });
});
