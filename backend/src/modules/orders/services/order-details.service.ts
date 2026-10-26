import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq } from 'drizzle-orm';
import { SINGLE_ROW_LIMIT } from '@/common/constants/database.constants';
import { CURRENCY } from '@/common/constants/money.constants';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { orders, orderStatusHistory, packages, payments } from '@/database/schema';
import { ORDERS_ERROR_MESSAGES } from '../constants/orders.constants';
import { toOrderHistory } from '../mappers/order-history.mapper';
import type { OrderDetails, OrderHistoryRow, OrderPaymentView } from '../types/orders.types';
import { addressPointColumns, aliasOrderAddresses } from '../utils/order-address-columns';

@Injectable()
export class OrderDetailsService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  // A foreign order looks the same as a missing one, so ids cannot be probed.
  async findOne(clientId: number, orderId: number): Promise<OrderDetails> {
    const row = await this.findOrderRow(clientId, orderId);

    if (!row) {
      throw new NotFoundException(ORDERS_ERROR_MESSAGES.NOT_FOUND);
    }

    // Read only after the order proved to be the client's, and at once: they do not depend on each other.
    const [historyRows, payment] = await Promise.all([
      this.findHistory(orderId),
      this.findLatestPayment(orderId),
    ]);
    const { recipientName, recipientPhone, price, ...rest } = row;

    return {
      ...rest,
      price: Number(price),
      currency: CURRENCY,
      recipient: { name: recipientName, phone: recipientPhone },
      ...toOrderHistory(historyRows, clientId),
      payment,
    };
  }

  private async findOrderRow(clientId: number, orderId: number) {
    const { pickup, delivery } = aliasOrderAddresses();

    const [row] = await this.db
      .select({
        orderId: orders.orderId,
        status: orders.status,
        price: orders.price,
        priceCoefficient: orders.priceCoefficient,
        distanceKm: orders.distanceKm,
        estimatedMinutes: orders.estimatedMinutes,
        estimatedDeliveryAt: orders.estimatedDeliveryAt,
        createdAt: orders.createdAt,
        recipientName: orders.recipientName,
        recipientPhone: orders.recipientPhone,
        pickup: addressPointColumns(pickup),
        delivery: addressPointColumns(delivery),
        parcel: {
          weightKg: packages.weight,
          lengthCm: packages.length,
          widthCm: packages.width,
          heightCm: packages.height,
          isFragile: packages.isFragile,
        },
      })
      .from(orders)
      .innerJoin(pickup, eq(orders.pickupAddressId, pickup.addressId))
      .innerJoin(delivery, eq(orders.deliveryAddressId, delivery.addressId))
      .innerJoin(packages, eq(packages.orderId, orders.orderId))
      .where(and(eq(orders.orderId, orderId), eq(orders.clientId, clientId)))
      .limit(SINGLE_ROW_LIMIT);

    return row;
  }

  private findHistory(orderId: number): Promise<OrderHistoryRow[]> {
    return this.db
      .select({
        status: orderStatusHistory.status,
        changedAt: orderStatusHistory.changedAt,
        changedBy: orderStatusHistory.changedBy,
      })
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, orderId))
      .orderBy(asc(orderStatusHistory.changedAt), asc(orderStatusHistory.statusHistoryId));
  }

  // The newest attempt shows the current state, older failed attempts are not interesting to the client.
  private async findLatestPayment(orderId: number): Promise<OrderPaymentView | null> {
    const [latest] = await this.db
      .select({ status: payments.status, amountUsd: payments.amountUsd })
      .from(payments)
      .where(eq(payments.orderId, orderId))
      .orderBy(desc(payments.createdAt), desc(payments.paymentId))
      .limit(SINGLE_ROW_LIMIT);

    return latest ? { status: latest.status, amountUsd: Number(latest.amountUsd) } : null;
  }
}
