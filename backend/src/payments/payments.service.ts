import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { and, eq } from 'drizzle-orm';
import { SINGLE_ROW_LIMIT } from '../common/constants/database';
import { MS_PER_MINUTE } from '../common/constants/time';
import { ORDER_STATUS } from '../common/enums/order-status.enum';
import { PAYMENT_STATUS } from '../common/enums/payment-status.enum';
import { ENV_KEYS } from '../config/env.constants';
import { DRIZZLE } from '../database/database.constants';
import type { Database } from '../database/database.module';
import { orders, payments } from '../db/schema';
import { NbrbService } from '../integrations/nbrb/nbrb.service';
import { ORDERS_ERROR_MESSAGES } from '../orders/orders.constants';
import { convertBynToUsdMinor, formatMinorAmount } from './payment-amount';
import { buildOrderReturnUrl } from './payment-urls';
import { PaymentGateway } from './payment.gateway';
import {
  CHECKOUT_SESSION_TTL_MINUTES,
  MIN_CHARGE_MINOR,
  PAYMENT_CURRENCY,
  PAYMENT_DESCRIPTION_PREFIX,
  PAYMENT_RETURN_RESULT,
  PAYMENTS_ERROR_MESSAGES,
} from './payments.constants';
import type { StartedPayment } from './payments.types';

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly gateway: PaymentGateway,
    private readonly nbrb: NbrbService,
    private readonly config: ConfigService,
  ) {}

  async start(clientId: number, orderId: number): Promise<StartedPayment> {
    const order = await this.findPayableOrder(clientId, orderId);
    await this.closePendingAttempts(orderId);

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

    const [payment] = await this.db
      .insert(payments)
      .values({
        orderId,
        amount: order.price,
        amountUsd: formatMinorAmount(amountMinor),
        exchangeRate: rate,
        checkoutSessionId: session.sessionId,
      })
      .returning({ paymentId: payments.paymentId });

    if (!payment) {
      throw new InternalServerErrorException(PAYMENTS_ERROR_MESSAGES.START_FAILED);
    }

    return { paymentId: payment.paymentId, checkoutUrl: session.url };
  }

  // A foreign order looks the same as a missing one, so ids cannot be probed.
  private async findPayableOrder(clientId: number, orderId: number): Promise<{ price: string }> {
    const [order] = await this.db
      .select({ price: orders.price, status: orders.status })
      .from(orders)
      .where(and(eq(orders.orderId, orderId), eq(orders.clientId, clientId)))
      .limit(SINGLE_ROW_LIMIT);

    if (!order) {
      throw new NotFoundException(ORDERS_ERROR_MESSAGES.NOT_FOUND);
    }

    if (order.status !== ORDER_STATUS.PENDING) {
      throw new ConflictException(PAYMENTS_ERROR_MESSAGES.ORDER_NOT_PAYABLE);
    }

    return order;
  }

  // A repeated click on "Pay" replaces the earlier attempt. An error of closing is not swallowed:
  // a session that cannot be closed may be already paid, and a second payment would charge twice.
  private async closePendingAttempts(orderId: number): Promise<void> {
    const pending = await this.db
      .select({ paymentId: payments.paymentId, sessionId: payments.checkoutSessionId })
      .from(payments)
      .where(and(eq(payments.orderId, orderId), eq(payments.status, PAYMENT_STATUS.PENDING)));

    for (const attempt of pending) {
      await this.gateway.expireCheckoutSession(attempt.sessionId);
      await this.db
        .update(payments)
        .set({ status: PAYMENT_STATUS.FAILED })
        .where(eq(payments.paymentId, attempt.paymentId));
    }
  }
}
