import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { SINGLE_ROW_LIMIT } from '../../../common/constants/database.constants';
import { CURRENCY } from '../../../common/constants/money.constants';
import { DRIZZLE } from '../../../database/database.constants';
import type { Database } from '../../../database/database.module';
import {
  addresses,
  orders,
  orderStatusHistory,
  packages,
  payments,
} from '../../../database/schema';
import { ORDER_ADDRESS_ALIAS, ORDERS_ERROR_MESSAGES } from '../constants/orders.constants';
import type { OrderDetails, OrderPaymentView } from '../types/orders.types';

@Injectable()
export class OrderDetailsService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  // A foreign order looks the same as a missing one, so ids cannot be probed.
  async findOne(clientId: number, orderId: number): Promise<OrderDetails> {
    const pickup = alias(addresses, ORDER_ADDRESS_ALIAS.PICKUP);
    const delivery = alias(addresses, ORDER_ADDRESS_ALIAS.DELIVERY);

    const [row] = await this.db
      .select({
        orderId: orders.orderId,
        status: orders.status,
        price: orders.price,
        priceCoefficient: orders.priceCoefficient,
        distanceKm: orders.distanceKm,
        estimatedDeliveryAt: orders.estimatedDeliveryAt,
        createdAt: orders.createdAt,
        recipientName: orders.recipientName,
        recipientPhone: orders.recipientPhone,
        pickup: {
          city: pickup.city,
          street: pickup.street,
          house: pickup.house,
          apartment: pickup.apartment,
          latitude: pickup.latitude,
          longitude: pickup.longitude,
        },
        delivery: {
          city: delivery.city,
          street: delivery.street,
          house: delivery.house,
          apartment: delivery.apartment,
          latitude: delivery.latitude,
          longitude: delivery.longitude,
        },
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

    if (!row) {
      throw new NotFoundException(ORDERS_ERROR_MESSAGES.NOT_FOUND);
    }

    const history = await this.db
      .select({ status: orderStatusHistory.status, changedAt: orderStatusHistory.changedAt })
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, orderId))
      .orderBy(asc(orderStatusHistory.changedAt), asc(orderStatusHistory.statusHistoryId));

    const payment = await this.findLatestPayment(orderId);
    const { recipientName, recipientPhone, price, ...rest } = row;

    return {
      ...rest,
      price: Number(price),
      currency: CURRENCY,
      recipient: { name: recipientName, phone: recipientPhone },
      history,
      payment,
    };
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
