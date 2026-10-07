import { Module } from '@nestjs/common';
import { PaymentGateway } from '../../payments/payment.gateway';
import { StripePaymentGateway } from './stripe-payment.gateway';

@Module({
  providers: [{ provide: PaymentGateway, useClass: StripePaymentGateway }],
  exports: [PaymentGateway],
})
export class StripeModule {}
