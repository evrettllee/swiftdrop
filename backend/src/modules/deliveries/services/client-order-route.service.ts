import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { SINGLE_ROW_LIMIT } from '../../../common/constants/database.constants';
import { DRIZZLE } from '../../../database/database.constants';
import type { Database } from '../../../database/database.module';
import { orders } from '../../../database/schema';
import { aliasOrderAddresses } from '../../orders/utils/order-address-columns';
import { RouteLinesService } from '../../routing/services/route-lines.service';
import type { RouteLines } from '../../routing/types/routing.types';
import { DELIVERIES_ERROR_MESSAGES } from '../constants/deliveries.constants';

@Injectable()
export class ClientOrderRouteService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly routes: RouteLinesService,
  ) {}

  // The route of an order of the client; a foreign order looks the same as a missing one.
  async find(clientId: number, orderId: number): Promise<RouteLines> {
    const { pickup, delivery } = aliasOrderAddresses();
    const [order] = await this.db
      .select({
        status: orders.status,
        courierId: orders.courierId,
        pickup: { latitude: pickup.latitude, longitude: pickup.longitude },
        delivery: { latitude: delivery.latitude, longitude: delivery.longitude },
      })
      .from(orders)
      .innerJoin(pickup, eq(pickup.addressId, orders.pickupAddressId))
      .innerJoin(delivery, eq(delivery.addressId, orders.deliveryAddressId))
      .where(and(eq(orders.orderId, orderId), eq(orders.clientId, clientId)))
      .limit(SINGLE_ROW_LIMIT);

    if (!order) {
      throw new NotFoundException(DELIVERIES_ERROR_MESSAGES.ORDER_NOT_FOUND);
    }

    return this.routes.forClientOrder(order);
  }
}
