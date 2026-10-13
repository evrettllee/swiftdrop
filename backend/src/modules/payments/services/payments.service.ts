import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { and, eq } from 'drizzle-orm';
import {
  ROW_LOCK_NO_KEY_UPDATE,
  SINGLE_ROW_LIMIT,
} from '../../../common/constants/database.constants';
import { isLockTimeout } from '../../../common/database/pg-errors';
import { ORDER_NOT_FOUND_MESSAGE } from '../../../common/constants/orders.constants';
import { MS_PER_MINUTE } from '../../../common/constants/time.constants';
import { ORDER_STATUS } from '../../../common/enums/order-status.enum';
import { ENV_KEYS } from '../../../config/env.constants';
import { DRIZZLE } from '../../../database/database.constants';
import type { Database, Transaction } from '../../../database/database.module';
import { orders } from '../../../database/schema';
import { NbrbService } from '../../../integrations/nbrb/services/nbrb.service';
import { convertBynToUsdMinor, formatMinorAmount } from '../utils/payment-amount';
import { buildOrderReturnUrl } from '../utils/payment-urls';
import { PaymentGateway } from '../contracts/payment-gateway.contract';
import {
  CHECKOUT_SESSION_TTL_MINUTES,
  MIN_CHARGE_MINOR,
  PAYMENT_CURRENCY,
  PAYMENT_DESCRIPTION_PREFIX,
  PAYMENT_RETURN_RESULT,
  PAYMENTS_ERROR_MESSAGES,
} from '../constants/payments.constants';
import type { StartedPayment } from '../types/payments.types';
import { PaymentAttemptsService } from './payment-attempts.service';

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly gateway: PaymentGateway,
    private readonly nbrb: NbrbService,
    private readonly config: ConfigService,
    private readonly attempts: PaymentAttemptsService,
  ) {}

  // The order row stays locked from the check to the saved attempt, so two starts of one order run
  // one after the other: the second closes the session of the first and opens its own. The order
  // never has two open sessions, so it cannot be paid twice.
  async start(clientId: number, orderId: number): Promise<StartedPayment> {
    return this.db.transaction(async (tx) => {
      const order = await this.lockPayableOrder(tx, clientId, orderId);
      await this.attempts.closePending(tx, orderId);

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

      const paymentId = await this.attempts.save(
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
        .for(ROW_LOCK_NO_KEY_UPDATE);
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
}
