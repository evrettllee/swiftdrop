import { Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { MONEY_FRACTION_DIGITS } from '../../../common/constants/money.constants';
import { MS_PER_MINUTE } from '../../../common/constants/time.constants';
import { ORDER_STATUS } from '../../../common/enums/order-status.enum';
import { DRIZZLE } from '../../../database/database.constants';
import type { Database } from '../../../database/database.module';
import { addresses, orders, orderStatusHistory, packages } from '../../../database/schema';
import { PricingService } from '../../pricing/services/pricing.service';
import type { CreateOrderDto } from '../dto/create-order.dto';
import { toAddressRow, toPackageRow } from '../mappers/order-rows.mapper';
import { ORDERS_ERROR_MESSAGES } from '../constants/orders.constants';
import type { CreatedOrder } from '../types/orders.types';

@Injectable()
export class OrderPlacementService {
  private readonly logger = new Logger(OrderPlacementService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly pricing: PricingService,
  ) {}

  async place(clientId: number, dto: CreateOrderDto): Promise<CreatedOrder> {
    // The price is always calculated here, the client cannot send its own.
    const { estimate, tariffId } = await this.pricing.quote({
      pickup: dto.pickup,
      delivery: dto.delivery,
      package: dto.package,
    });
    const estimatedDeliveryAt = new Date(Date.now() + estimate.estimatedMinutes * MS_PER_MINUTE);

    const orderId = await this.db.transaction(async (tx) => {
      const [pickup, delivery] = await tx
        .insert(addresses)
        .values([toAddressRow(dto.pickup), toAddressRow(dto.delivery)])
        .returning({ addressId: addresses.addressId });

      if (!pickup || !delivery) {
        throw new InternalServerErrorException(ORDERS_ERROR_MESSAGES.CREATE_FAILED);
      }

      const [order] = await tx
        .insert(orders)
        .values({
          clientId,
          tariffId,
          pickupAddressId: pickup.addressId,
          deliveryAddressId: delivery.addressId,
          status: ORDER_STATUS.PENDING,
          recipientName: dto.recipient.name,
          recipientPhone: dto.recipient.phone,
          price: estimate.price.toFixed(MONEY_FRACTION_DIGITS),
          priceCoefficient: estimate.coefficient,
          distanceKm: estimate.distanceKm,
          estimatedMinutes: estimate.estimatedMinutes,
          estimatedDeliveryAt,
        })
        .returning({ orderId: orders.orderId });

      if (!order) {
        throw new InternalServerErrorException(ORDERS_ERROR_MESSAGES.CREATE_FAILED);
      }

      await tx.insert(packages).values(toPackageRow(order.orderId, dto.package));
      await tx
        .insert(orderStatusHistory)
        .values({ orderId: order.orderId, status: ORDER_STATUS.PENDING, changedBy: clientId });

      return order.orderId;
    });

    this.logger.log(`Order ${orderId} placed by client ${clientId}`);

    return {
      orderId,
      status: ORDER_STATUS.PENDING,
      price: estimate.price,
      currency: estimate.currency,
      estimatedDeliveryAt,
    };
  }
}
