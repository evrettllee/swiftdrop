import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { MS_PER_SECOND } from '@/common/constants/time.constants';
import { describeError } from '@/common/utils/describe-error';
import { ENV_KEYS } from '@/config/env.constants';
import { PaymentGateway } from '@/modules/payments/contracts/payment-gateway.contract';
import {
  PAYMENTS_ERROR_MESSAGES,
  SESSION_EXPIRE_RESULT,
} from '@/modules/payments/constants/payments.constants';
import type {
  CheckoutSession,
  CheckoutSessionInput,
  CheckoutSessionState,
  PaymentEvent,
  SessionExpireResult,
} from '@/modules/payments/types/payments.types';
import { mapStripeEvent, mapStripeSession } from '../mappers/stripe-event.mapper';
import {
  SINGLE_ITEM_QUANTITY,
  STRIPE_CHECKOUT_MODE,
  STRIPE_METADATA_ORDER_ID_KEY,
  STRIPE_REFUND_IDEMPOTENCY_PREFIX,
} from '../constants/stripe.constants';
import { StripeCheckoutApi } from '../contracts/stripe-checkout.contract';

@Injectable()
export class StripePaymentAdapter extends PaymentGateway {
  private readonly logger = new Logger(StripePaymentAdapter.name);
  private readonly webhookSecret: string;

  constructor(
    private readonly client: StripeCheckoutApi,
    config: ConfigService,
  ) {
    super();
    this.webhookSecret = config.getOrThrow<string>(ENV_KEYS.STRIPE_WEBHOOK_SECRET);
  }

  async createCheckoutSession(input: CheckoutSessionInput): Promise<CheckoutSession> {
    const session = await this.call(() =>
      this.client.createSession({
        mode: STRIPE_CHECKOUT_MODE,
        line_items: [
          {
            quantity: SINGLE_ITEM_QUANTITY,
            price_data: {
              currency: input.currency,
              unit_amount: input.amountMinor,
              product_data: { name: input.description },
            },
          },
        ],
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
        expires_at: Math.floor(input.expiresAt.getTime() / MS_PER_SECOND),
        client_reference_id: String(input.orderId),
        metadata: { [STRIPE_METADATA_ORDER_ID_KEY]: String(input.orderId) },
      }),
    );

    if (!session.url) {
      this.logger.error(`Stripe session ${session.id} has no payment page address`);
      throw new ServiceUnavailableException(PAYMENTS_ERROR_MESSAGES.GATEWAY_UNAVAILABLE);
    }

    return { sessionId: session.id, url: session.url };
  }

  async expireCheckoutSession(sessionId: string): Promise<SessionExpireResult> {
    let result: SessionExpireResult = SESSION_EXPIRE_RESULT.EXPIRED;

    try {
      await this.client.expireSession(sessionId);
    } catch (error) {
      if (!isNotOpenSessionError(error)) {
        throw this.unavailable(error);
      }

      result = SESSION_EXPIRE_RESULT.NOT_OPEN;
    }

    return result;
  }

  async getCheckoutSession(sessionId: string): Promise<CheckoutSessionState> {
    const session = await this.call(() => this.client.retrieveSession(sessionId));

    return mapStripeSession(session);
  }

  async refund(paymentRef: string): Promise<void> {
    await this.call(() =>
      this.client.createRefund(paymentRef, `${STRIPE_REFUND_IDEMPOTENCY_PREFIX}${paymentRef}`),
    );
  }

  parseWebhook(rawBody: Buffer, signature: string): PaymentEvent | null {
    let event: Stripe.Event;

    try {
      event = Stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
    } catch {
      this.logger.warn('Stripe webhook signature check failed');
      throw new BadRequestException(PAYMENTS_ERROR_MESSAGES.INVALID_SIGNATURE);
    }

    return mapStripeEvent(event);
  }

  private async call<T>(request: () => Promise<T>): Promise<T> {
    try {
      return await request();
    } catch (error) {
      throw this.unavailable(error);
    }
  }

  // Any unexpected failure of Stripe becomes one clear answer for the client, details go to the log.
  private unavailable(error: unknown): ServiceUnavailableException {
    this.logger.error(`Stripe request failed: ${describeError(error)}`);

    return new ServiceUnavailableException(PAYMENTS_ERROR_MESSAGES.GATEWAY_UNAVAILABLE);
  }
}

// Stripe refuses to close a session that is not open (paid or expired) with an invalid request of
// status 400. A missing session is 404 and stays an unexpected failure.
function isNotOpenSessionError(error: unknown): boolean {
  return (
    error instanceof Stripe.errors.StripeInvalidRequestError &&
    error.statusCode === HttpStatus.BAD_REQUEST
  );
}
