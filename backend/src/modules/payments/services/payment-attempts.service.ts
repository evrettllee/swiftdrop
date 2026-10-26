import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { PAYMENTS_ONE_PENDING_PER_ORDER_INDEX } from '@/common/constants/database.constants';
import { getUniqueViolationConstraint } from '@/common/database/pg-errors';
import { PAYMENT_STATUS } from '@/common/enums/payment-status.enum';
import { describeError } from '@/common/utils/describe-error';
import type { Transaction } from '@/database/database.module';
import { payments } from '@/database/schema';
import { PaymentGateway } from '../contracts/payment-gateway.contract';
import { PAYMENTS_ERROR_MESSAGES, SESSION_EXPIRE_RESULT } from '../constants/payments.constants';

// The payment attempts of an order while a payment is being started: the earlier open attempts are
// closed and the new one is saved, all inside the transaction that holds the order row.
@Injectable()
export class PaymentAttemptsService {
  private readonly logger = new Logger(PaymentAttemptsService.name);

  constructor(private readonly gateway: PaymentGateway) {}

  // A repeated click on "Pay" replaces the earlier attempt. An error of closing is not swallowed:
  // a session that cannot be closed may be already paid, and a second payment would charge twice.
  async closePending(tx: Transaction, orderId: number): Promise<void> {
    const pending = await tx
      .select({ paymentId: payments.paymentId, sessionId: payments.checkoutSessionId })
      .from(payments)
      .where(and(eq(payments.orderId, orderId), eq(payments.status, PAYMENT_STATUS.PENDING)));

    for (const attempt of pending) {
      const result = await this.gateway.expireCheckoutSession(attempt.sessionId);

      if (result === SESSION_EXPIRE_RESULT.NOT_OPEN) {
        this.logger.warn(
          `Session of payment ${attempt.paymentId} is no longer open, a new payment is refused`,
        );
        throw new ServiceUnavailableException(PAYMENTS_ERROR_MESSAGES.GATEWAY_UNAVAILABLE);
      }

      await tx
        .update(payments)
        .set({ status: PAYMENT_STATUS.FAILED })
        .where(eq(payments.paymentId, attempt.paymentId));
    }
  }

  // The unique index of the open attempt is the last guard: if another open attempt of the order
  // got saved anyway, the session just created is closed, so nobody can pay through it.
  async save(
    tx: Transaction,
    values: typeof payments.$inferInsert,
    sessionId: string,
  ): Promise<number> {
    let saved: { paymentId: number }[];

    try {
      saved = await tx.insert(payments).values(values).returning({ paymentId: payments.paymentId });
    } catch (error) {
      if (getUniqueViolationConstraint(error) !== PAYMENTS_ONE_PENDING_PER_ORDER_INDEX) {
        throw error;
      }

      await this.closeUnsavedSession(sessionId);
      throw new ConflictException(PAYMENTS_ERROR_MESSAGES.PAYMENT_ALREADY_STARTED);
    }

    const [payment] = saved;

    if (!payment) {
      throw new InternalServerErrorException(PAYMENTS_ERROR_MESSAGES.START_FAILED);
    }

    return payment.paymentId;
  }

  // A session without a saved attempt would be unknown to the webhook, so a failure to close it is
  // logged with the session id for a manual check.
  private async closeUnsavedSession(sessionId: string): Promise<void> {
    try {
      const result = await this.gateway.expireCheckoutSession(sessionId);

      if (result === SESSION_EXPIRE_RESULT.NOT_OPEN) {
        this.logger.warn(`Session ${sessionId} of a refused payment attempt is no longer open`);
      }
    } catch (error) {
      this.logger.error(
        `Session ${sessionId} of a refused payment attempt was not closed: ${describeError(error)}`,
      );
    }
  }
}
