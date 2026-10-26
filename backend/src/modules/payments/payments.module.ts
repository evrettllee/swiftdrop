import { Module } from '@nestjs/common';
import { NbrbModule } from '@/integrations/nbrb/nbrb.module';
import { StripeModule } from '@/integrations/stripe/stripe.module';
import { PaymentAttemptsService } from './services/payment-attempts.service';
import { PaymentCancellationService } from './services/payment-cancellation.service';
import { PaymentReconciliationService } from './services/payment-reconciliation.service';
import { PaymentRefundService } from './services/payment-refund.service';
import { PaymentSettlementService } from './services/payment-settlement.service';
import { PaymentWebhookService } from './services/payment-webhook.service';
import { PaymentsController } from './controllers/payments.controller';
import { PaymentsService } from './services/payments.service';
import { TrackingModule } from '@/modules/tracking/tracking.module';

@Module({
  imports: [StripeModule, NbrbModule, TrackingModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PaymentAttemptsService,
    PaymentRefundService,
    PaymentSettlementService,
    PaymentWebhookService,
    PaymentCancellationService,
    PaymentReconciliationService,
  ],
  exports: [PaymentCancellationService, PaymentReconciliationService],
})
export class PaymentsModule {}
