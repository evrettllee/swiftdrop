import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { PAYMENT_STATUS } from '@/common/enums/payment-status.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { payments } from '@/database/schema';
import { PaymentGateway } from '../contracts/payment-gateway.contract';
import {
  CHECKOUT_SESSION_STATUS,
  ORDER_REFUND,
  PENDING_PAYMENT_OUTCOME,
  SESSION_EXPIRE_RESULT,
} from '../constants/payments.constants';
import type {
  CheckoutSessionState,
  OrderRefund,
  PendingPaymentOutcome,
} from '../types/payments.types';
import { PaymentRefundService } from './payment-refund.service';
import { PaymentSettlementService } from './payment-settlement.service';

type PendingPayment = {
  paymentId: number;
  checkoutSessionId: string;
};

@Injectable()
export class PaymentCancellationService {
  private readonly logger = new Logger(PaymentCancellationService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly gateway: PaymentGateway,
    private readonly refunds: PaymentRefundService,
    private readonly settlement: PaymentSettlementService,
  ) {}

  // Called when an order is cancelled: the unpaid sessions are closed and the paid money goes back.
  async releaseOrderPayments(orderId: number): Promise<OrderRefund> {
    const outcomes = await this.releasePendingPayments(orderId);
    const refundedCount = await this.refunds.refundOrderPayments(orderId);
    let refund: OrderRefund = ORDER_REFUND.NONE;

    if (outcomes.includes(PENDING_PAYMENT_OUTCOME.LEFT_PENDING)) {
      refund = ORDER_REFUND.PENDING;
    } else if (refundedCount > 0 || outcomes.includes(PENDING_PAYMENT_OUTCOME.REFUNDED)) {
      refund = ORDER_REFUND.REFUNDED;
    }

    return refund;
  }

  // Closes the sessions of the pending payments of a cancelled order and settles each payment by
  // the state of its session, returns what happened to each payment.
  async releasePendingPayments(orderId: number): Promise<PendingPaymentOutcome[]> {
    const pending = await this.db
      .select({
        paymentId: payments.paymentId,
        checkoutSessionId: payments.checkoutSessionId,
      })
      .from(payments)
      .where(and(eq(payments.orderId, orderId), eq(payments.status, PAYMENT_STATUS.PENDING)));
    const outcomes: PendingPaymentOutcome[] = [];

    for (const payment of pending) {
      outcomes.push(await this.releasePayment(payment));
    }

    return outcomes;
  }

  private async releasePayment(payment: PendingPayment): Promise<PendingPaymentOutcome> {
    let outcome: PendingPaymentOutcome = PENDING_PAYMENT_OUTCOME.FAILED;

    if (await this.expireSession(payment)) {
      await this.settlement.markFailed(payment.checkoutSessionId);
    } else {
      outcome = await this.reconcile(payment);
    }

    return outcome;
  }

  // True when the session was closed now. A session that is no longer open, or that the payment
  // system failed to close, is checked against the payment system.
  private async expireSession({ paymentId, checkoutSessionId }: PendingPayment): Promise<boolean> {
    let isExpired = false;

    try {
      isExpired =
        (await this.gateway.expireCheckoutSession(checkoutSessionId)) ===
        SESSION_EXPIRE_RESULT.EXPIRED;

      if (!isExpired) {
        this.logger.log(`Session of payment ${paymentId} is no longer open, its state is checked`);
      }
    } catch {
      // The gateway has logged the failure.
    }

    return isExpired;
  }

  // Brings the payment to the state of its session the way the webhook does, so a webhook that
  // comes later changes nothing. A session still open (or unknown) stays with the webhook: if it
  // gets paid, the webhook refunds the money, because the order is already cancelled.
  private async reconcile(payment: PendingPayment): Promise<PendingPaymentOutcome> {
    const { paymentId, checkoutSessionId } = payment;
    const session = await this.readSession(checkoutSessionId);
    let outcome: PendingPaymentOutcome = PENDING_PAYMENT_OUTCOME.LEFT_PENDING;

    if (session?.status === CHECKOUT_SESSION_STATUS.EXPIRED) {
      await this.settlement.markFailed(checkoutSessionId);
      this.logger.log(`Session of payment ${paymentId} has expired, the payment is failed`);
      outcome = PENDING_PAYMENT_OUTCOME.FAILED;
    } else if (
      session?.status === CHECKOUT_SESSION_STATUS.COMPLETE &&
      session.isPaid &&
      session.paymentRef
    ) {
      this.logger.warn(`Payment ${paymentId} was paid for a cancelled order, refunding`);
      await this.settlement.markPaid(checkoutSessionId, session.paymentRef);
      // The refund has an idempotency key in the payment system, so it never happens twice.
      await this.refunds.refundPayment(paymentId);
      outcome = PENDING_PAYMENT_OUTCOME.REFUNDED;
    } else {
      this.logger.warn(
        `Session of payment ${paymentId} was not closed, the webhook will settle it`,
      );
    }

    return outcome;
  }

  // Null when the payment system could not be asked; the gateway has logged the failure.
  private async readSession(sessionId: string): Promise<CheckoutSessionState | null> {
    let session: CheckoutSessionState | null = null;

    try {
      session = await this.gateway.getCheckoutSession(sessionId);
    } catch {
      // The session stays unknown.
    }

    return session;
  }
}
