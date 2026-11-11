import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { ENV_KEYS } from '@/config/env.constants';
import { STRIPE_REQUEST_TIMEOUT_MS } from '../constants/stripe.constants';
import { StripeCheckoutApi } from '../contracts/stripe-checkout.contract';
import type { StripeSessionLink, StripeSessionState } from '../types/stripe.types';

@Injectable()
export class StripeCheckoutClient extends StripeCheckoutApi {
  private readonly stripe: Stripe;

  constructor(config: ConfigService) {
    super();
    this.stripe = new Stripe(config.getOrThrow<string>(ENV_KEYS.STRIPE_SECRET_KEY), {
      timeout: STRIPE_REQUEST_TIMEOUT_MS,
    });
  }

  createSession(params: Stripe.Checkout.SessionCreateParams): Promise<StripeSessionLink> {
    return this.stripe.checkout.sessions.create(params);
  }

  async expireSession(sessionId: string): Promise<void> {
    await this.stripe.checkout.sessions.expire(sessionId);
  }

  retrieveSession(sessionId: string): Promise<StripeSessionState> {
    return this.stripe.checkout.sessions.retrieve(sessionId);
  }

  async createRefund(paymentIntent: string, idempotencyKey: string): Promise<void> {
    await this.stripe.refunds.create({ payment_intent: paymentIntent }, { idempotencyKey });
  }
}
