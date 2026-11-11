import type { Database } from '@/database/database.module';
import type { PaymentGateway } from '../contracts/payment-gateway.contract';
import type { PendingPaymentOutcome } from '../types/payments.types';
import { PaymentCancellationService } from './payment-cancellation.service';
import type { PaymentRefundService } from './payment-refund.service';
import type { PaymentSettlementService } from './payment-settlement.service';

function setUp(pending: PendingPaymentOutcome[], refundedCount: number) {
  const refundOrderPayments = jest.fn().mockResolvedValue(refundedCount);
  const service = new PaymentCancellationService(
    {} as Database,
    {} as PaymentGateway,
    { refundOrderPayments } as unknown as PaymentRefundService,
    {} as PaymentSettlementService,
  );
  jest.spyOn(service, 'releasePendingPayments').mockResolvedValue(pending);

  return { service, refundOrderPayments };
}

describe('PaymentCancellationService.releaseOrderPayments', () => {
  it.each([
    [[], 0, 'none'],
    [['failed'], 0, 'none'],
    [[], 1, 'refunded'],
    [['refunded'], 0, 'refunded'],
    [['left_pending'], 0, 'pending'],
    [['left_pending'], 1, 'pending'],
  ] as const)(
    'should sum up the pending payments %j and %s refunds as %s',
    async (pending, refundedCount, refund) => {
      const { service, refundOrderPayments } = setUp([...pending], refundedCount);

      await expect(service.releaseOrderPayments(42)).resolves.toBe(refund);
      expect(refundOrderPayments).toHaveBeenCalledWith(42);
    },
  );
});
