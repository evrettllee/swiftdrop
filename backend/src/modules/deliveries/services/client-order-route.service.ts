import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { SINGLE_ROW_LIMIT } from '../../../common/constants/database.constants';
import { MS_PER_SECOND } from '../../../common/constants/time.constants';
import { DRIZZLE } from '../../../database/database.constants';
import type { Database } from '../../../database/database.module';
import { courierProfiles, orders } from '../../../database/schema';
import { aliasOrderAddresses } from '../../orders/utils/order-address-columns';
import { RouteLinesService } from '../../routing/services/route-lines.service';
import { DELIVERIES_ERROR_MESSAGES } from '../constants/deliveries.constants';
import type { ClientOrderRoute } from '../types/deliveries.types';
import { toClientCourierPosition } from '../utils/courier-position';

@Injectable()
export class ClientOrderRouteService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly routes: RouteLinesService,
  ) {}

  // The route of an order of the client and where its courier is; a foreign order looks the same as
  // a missing one. The age of the position is counted by the clock of the database that stored it.
  async find(clientId: number, orderId: number): Promise<ClientOrderRoute> {
    const { pickup, delivery } = aliasOrderAddresses();
    const [order] = await this.db
      .select({
        status: orders.status,
        courierId: orders.courierId,
        pickup: { latitude: pickup.latitude, longitude: pickup.longitude },
        delivery: { latitude: delivery.latitude, longitude: delivery.longitude },
        currentLat: courierProfiles.currentLat,
        currentLng: courierProfiles.currentLng,
        locationUpdatedAt: courierProfiles.locationUpdatedAt,
        positionAgeMs: sql<
          number | null
        >`(extract(epoch from now() - ${courierProfiles.locationUpdatedAt}) * ${MS_PER_SECOND})::float8`,
      })
      .from(orders)
      .innerJoin(pickup, eq(pickup.addressId, orders.pickupAddressId))
      .innerJoin(delivery, eq(delivery.addressId, orders.deliveryAddressId))
      .leftJoin(courierProfiles, eq(courierProfiles.courierProfileId, orders.courierId))
      .where(and(eq(orders.orderId, orderId), eq(orders.clientId, clientId)))
      .limit(SINGLE_ROW_LIMIT);

    if (!order) {
      throw new NotFoundException(DELIVERIES_ERROR_MESSAGES.ORDER_NOT_FOUND);
    }

    const lines = await this.routes.forClientOrder(order);

    return { ...lines, courierPosition: toClientCourierPosition(order) };
  }
}
