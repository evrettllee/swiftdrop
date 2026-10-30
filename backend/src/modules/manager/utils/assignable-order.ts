import { ConflictException, HttpStatus, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import {
  ORDER_NOT_FOUND_MESSAGE,
  STAFF_ASSIGNABLE_STATUSES,
} from '@/common/constants/orders.constants';
import { SINGLE_ROW_LIMIT } from '@/common/constants/database.constants';
import { parcelColumns } from '@/common/database/parcel-columns';
import type { OrderStatus } from '@/common/enums/order-status.enum';
import type { PackageSpec } from '@/common/schemas/package-spec.schema';
import type { GeoPoint } from '@/common/schemas/geo-point.schema';
import type { Database, Transaction } from '@/database/database.module';
import { addresses, orders, packages } from '@/database/schema';
import {
  COURIER_NOT_AVAILABLE_CODE,
  MANAGER_ASSIGNMENT_MESSAGES,
  ORDER_NOT_ASSIGNABLE_CODE,
  type UnsuitableReason,
} from '../constants/manager-assignment.constants';

const ROW_LOCK_UPDATE = 'update';

export type AssignableOrder = {
  orderId: number;
  pickup: GeoPoint;
  parcel: PackageSpec;
};

const assignableStatuses = new Set<OrderStatus>(STAFF_ASSIGNABLE_STATUSES);

export function isAssignable(status: OrderStatus): boolean {
  return assignableStatuses.has(status);
}

export async function loadAssignableOrder(
  executor: Database | Transaction,
  orderId: number,
  lock: boolean,
): Promise<AssignableOrder> {
  const query = executor
    .select({
      orderId: orders.orderId,
      status: orders.status,
      pickup: { latitude: addresses.latitude, longitude: addresses.longitude },
      parcel: parcelColumns(),
    })
    .from(orders)
    .innerJoin(addresses, eq(addresses.addressId, orders.pickupAddressId))
    .innerJoin(packages, eq(packages.orderId, orders.orderId))
    .where(eq(orders.orderId, orderId))
    .limit(SINGLE_ROW_LIMIT);
  const [order] = await (lock ? query.for(ROW_LOCK_UPDATE, { of: orders }) : query);

  if (!order) {
    throw new NotFoundException(ORDER_NOT_FOUND_MESSAGE);
  }

  if (!isAssignable(order.status)) {
    throw new ConflictException({
      statusCode: HttpStatus.CONFLICT,
      code: ORDER_NOT_ASSIGNABLE_CODE,
      message: MANAGER_ASSIGNMENT_MESSAGES.ORDER_NOT_ASSIGNABLE,
    });
  }

  return { orderId: order.orderId, pickup: order.pickup, parcel: order.parcel };
}

export function courierNotAvailable(reason: UnsuitableReason): ConflictException {
  return new ConflictException({
    statusCode: HttpStatus.CONFLICT,
    code: COURIER_NOT_AVAILABLE_CODE,
    message: MANAGER_ASSIGNMENT_MESSAGES.COURIER_NOT_AVAILABLE,
    reason,
  });
}
