import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { and, eq } from 'drizzle-orm';
import {
  PAYMENTS_ONE_PENDING_PER_ORDER_INDEX,
  SINGLE_ROW_LIMIT,
} from '../../common/constants/database.constants';
import { getUniqueViolationConstraint, isLockTimeout } from '../../common/database/pg-errors';
import { ORDER_NOT_FOUND_MESSAGE } from '../../common/constants/orders.constants';
import { MS_PER_MINUTE } from '../../common/constants/time.constants';
import { ORDER_STATUS } from '../../common/enums/order-status.enum';
import { PAYMENT_STATUS } from '../../common/enums/payment-status.enum';
import { ENV_KEYS } from '../../config/env.constants';
import { DRIZZLE } from '../../database/database.constants';
import type { Database, Transaction } from '../../database/database.module';
import { orders, payments } from '../../db/schema';
import { NbrbService } from '../../integrations/nbrb/nbrb.service';
import { convertBynToUsdMinor, formatMinorAmount } from '../utils/payment-amount';
import { buildOrderReturnUrl } from '../utils/payment-urls';
import { PaymentGateway } from '../gateway/payment.gateway';
import {
  CHECKOUT_SESSION_TTL_MINUTES,
  MIN_CHARGE_MINOR,
  PAYMENT_CURRENCY,
  PAYMENT_DESCRIPTION_PREFIX,
  PAYMENT_RETURN_RESULT,
  PAYMENTS_ERROR_MESSAGES,
  SESSION_EXPIRE_RESULT,
} from '../payments.constants';
import type { StartedPayment } from '../payments.types';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly gateway: PaymentGateway,
    private readonly nbrb: NbrbService,
    private readonly config: ConfigService,
  ) {}

  // The order row stays locked from the check to the saved attempt, so two starts of one order run
  // one after the other: the second closes the session of the first and opens its own. The order
  // never has two open sessions, so it cannot be paid twice.
  async start(clientId: number, orderId: number): Promise<StartedPayment> {
    return this.db.transaction(async (tx) => {
      const order = await this.lockPayableOrder(tx, clientId, orderId);
      await this.closePendingAttempts(tx, orderId);

      const rate = await this.nbrb.getUsdRate();
      const amountMinor = convertBynToUsdMinor(Number(order.price), rate);

      if (amountMinor < MIN_CHARGE_MINOR) {
        throw new UnprocessableEntityException(PAYMENTS_ERROR_MESSAGES.AMOUNT_TOO_SMALL);
      }

      const appUrl = this.config.getOrThrow<string>(ENV_KEYS.APP_URL);
      const session = await this.gateway.createCheckoutSession({
        orderId,
        amountMinor,
        currency: PAYMENT_CURRENCY,
        description: `${PAYMENT_DESCRIPTION_PREFIX}${orderId}`,
        successUrl: buildOrderReturnUrl(appUrl, orderId, PAYMENT_RETURN_RESULT.SUCCESS),
        cancelUrl: buildOrderReturnUrl(appUrl, orderId, PAYMENT_RETURN_RESULT.CANCELLED),
        expiresAt: new Date(Date.now() + CHECKOUT_SESSION_TTL_MINUTES * MS_PER_MINUTE),
      });

      const paymentId = await this.saveAttempt(
        tx,
        {
          orderId,
          amount: order.price,
          amountUsd: formatMinorAmount(amountMinor),
          exchangeRate: rate,
          checkoutSessionId: session.sessionId,
        },
        session.sessionId,
      );

      return { paymentId, checkoutUrl: session.url };
    });
  }

  // The unique index of the open attempt is the last guard: if another open attempt of the order
  // got saved anyway, the session just created is closed, so nobody can pay through it.
  private async saveAttempt(
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
        `Session ${sessionId} of a refused payment attempt was not closed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  // A foreign order looks the same as a missing one, so ids cannot be probed. A row held longer
  // than the lock timeout means another start of this order is still talking to Stripe.
  private async lockPayableOrder(
    tx: Transaction,
    clientId: number,
    orderId: number,
  ): Promise<{ price: string }> {
    let order: { price: string; status: string } | undefined;

    try {
      [order] = await tx
        .select({ price: orders.price, status: orders.status })
        .from(orders)
        .where(and(eq(orders.orderId, orderId), eq(orders.clientId, clientId)))
        .limit(SINGLE_ROW_LIMIT)
        // Enough to queue the starts of one order; unlike FOR UPDATE it does not block the rows
        // that only refer to the order (a new payment, an entry of the history).
        .for('no key update');
    } catch (error) {
      if (isLockTimeout(error)) {
        throw new ConflictException(PAYMENTS_ERROR_MESSAGES.PAYMENT_ALREADY_STARTED);
      }

      throw error;
    }

    if (!order) {
      throw new NotFoundException(ORDER_NOT_FOUND_MESSAGE);
    }

    if (order.status !== ORDER_STATUS.PENDING) {
      throw new ConflictException(PAYMENTS_ERROR_MESSAGES.ORDER_NOT_PAYABLE);
    }

    return order;
  }

  // A repeated click on "Pay" replaces the earlier attempt. An error of closing is not swallowed:
  // a session that cannot be closed may be already paid, and a second payment would charge twice.
  private async closePendingAttempts(tx: Transaction, orderId: number): Promise<void> {
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
}
