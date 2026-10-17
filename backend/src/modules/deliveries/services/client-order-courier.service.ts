import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { SINGLE_ROW_LIMIT } from '../../../common/constants/database.constants';
import { DRIZZLE } from '../../../database/database.constants';
import type { Database } from '../../../database/database.module';
import { courierProfiles, orders, users, vehicles } from '../../../database/schema';
import { DELIVERIES_ERROR_MESSAGES } from '../constants/deliveries.constants';
import { toClientOrderCourier } from '../mappers/client-order-courier.mapper';
import type { ClientOrderCourier } from '../types/deliveries.types';

@Injectable()
export class ClientOrderCourierService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  // A foreign order looks the same as a missing one, so ids cannot be probed.
  async find(clientId: number, orderId: number): Promise<ClientOrderCourier> {
    const [row] = await this.db
      .select({
        status: orders.status,
        otpCode: orders.otpCode,
        firstName: users.firstName,
        lastName: users.lastName,
        vehicleType: vehicles.type,
        brand: vehicles.brand,
        model: vehicles.model,
        licensePlate: vehicles.licensePlate,
      })
      .from(orders)
      .leftJoin(courierProfiles, eq(courierProfiles.courierProfileId, orders.courierId))
      .leftJoin(users, eq(users.userId, courierProfiles.userId))
      .leftJoin(vehicles, eq(vehicles.courierProfileId, courierProfiles.courierProfileId))
      .where(and(eq(orders.orderId, orderId), eq(orders.clientId, clientId)))
      .limit(SINGLE_ROW_LIMIT);

    if (!row) {
      throw new NotFoundException(DELIVERIES_ERROR_MESSAGES.ORDER_NOT_FOUND);
    }

    return toClientOrderCourier(row);
  }
}
