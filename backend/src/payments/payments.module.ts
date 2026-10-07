import { Module } from '@nestjs/common';
import { NbrbModule } from '../integrations/nbrb/nbrb.module';
import { StripeModule } from '../integrations/stripe/stripe.module';
import { PaymentCancellationService } from './payment-cancellation.service';
import { PaymentRefundService } from './payment-refund.service';
import { PaymentWebhookService } from './payment-webhook.service';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

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
