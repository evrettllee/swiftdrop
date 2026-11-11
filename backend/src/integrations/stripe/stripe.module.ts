import { Module } from '@nestjs/common';
import { PaymentGateway } from '@/modules/payments/contracts/payment-gateway.contract';
import { StripePaymentAdapter } from './adapters/stripe-payment.adapter';
import { StripeCheckoutClient } from './clients/stripe-checkout.client';
import { StripeCheckoutApi } from './contracts/stripe-checkout.contract';

@Module({
  providers: [
    { provide: StripeCheckoutApi, useClass: StripeCheckoutClient },
    { provide: PaymentGateway, useClass: StripePaymentAdapter },
  ],
  exports: [PaymentGateway],
})
export class StripeModule {}
