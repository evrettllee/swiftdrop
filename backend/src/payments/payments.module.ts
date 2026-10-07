import { Module } from '@nestjs/common';
import { NbrbModule } from '../integrations/nbrb/nbrb.module';
import { StripeModule } from '../integrations/stripe/stripe.module';
import { PaymentCancellationService } from './services/payment-cancellation.service';
import { PaymentRefundService } from './services/payment-refund.service';
import { PaymentWebhookService } from './services/payment-webhook.service';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './services/payments.service';

@Module({
  imports: [StripeModule, NbrbModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PaymentRefundService,
    PaymentWebhookService,
    PaymentCancellationService,
  ],
  exports: [PaymentCancellationService],
})
export class PaymentsModule {}
