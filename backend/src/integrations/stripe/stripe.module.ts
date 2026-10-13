import { Module } from '@nestjs/common';
import { PaymentGateway } from '../../modules/payments/contracts/payment-gateway.contract';
import { StripePaymentAdapter } from './adapters/stripe-payment.adapter';

@Module({
  providers: [{ provide: PaymentGateway, useClass: StripePaymentAdapter }],
  exports: [PaymentGateway],
})
export class StripeModule {}
