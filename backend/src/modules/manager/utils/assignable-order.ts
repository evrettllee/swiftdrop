import { ConflictException, HttpStatus, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import {
  ORDER_NOT_FOUND_MESSAGE,
  STAFF_ASSIGNABLE_STATUSES,
  STAFF_AUTO_ASSIGN_RESTARTABLE_STATUSES,
  STAFF_REASSIGNABLE_STATUSES,
} from '@/common/constants/orders.constants';
import { SINGLE_ROW_LIMIT } from '@/common/constants/database.constants';
import { parcelColumns } from '@/common/database/parcel-columns';
import type { OrderStatus } from '@/common/enums/order-status.enum';
import type { PackageSpec } from '@/common/schemas/package-spec.schema';
import type { GeoPoint } from '@/common/schemas/geo-point.schema';
import type { Database, Transaction } from '@/database/database.module';
import { addresses, orders, packages } from '@/database/schema';
import {
  COURIER_CHANGED_CODE,
  COURIER_NOT_AVAILABLE_CODE,
  MANAGER_ASSIGNMENT_MESSAGES,
  ORDER_NOT_ASSIGNABLE_CODE,
  ORDER_NOT_REASSIGNABLE_CODE,
  ORDER_NOT_RESTARTABLE_CODE,
  type UnsuitableReason,
} from '../constants/manager-assignment.constants';

const ROW_LOCK_UPDATE = 'update';

export type StaffOrderRule = {
  statuses: readonly OrderStatus[];
  code: string;
  message: string;
};

export const ASSIGN_RULE: StaffOrderRule = {
  statuses: STAFF_ASSIGNABLE_STATUSES,
  code: ORDER_NOT_ASSIGNABLE_CODE,
  message: MANAGER_ASSIGNMENT_MESSAGES.ORDER_NOT_ASSIGNABLE,
};

export const REASSIGN_RULE: StaffOrderRule = {
  statuses: STAFF_REASSIGNABLE_STATUSES,
  code: ORDER_NOT_REASSIGNABLE_CODE,
  message: MANAGER_ASSIGNMENT_MESSAGES.ORDER_NOT_REASSIGNABLE,
};

export const RESTART_RULE: StaffOrderRule = {
  statuses: STAFF_AUTO_ASSIGN_RESTARTABLE_STATUSES,
  code: ORDER_NOT_RESTARTABLE_CODE,
  message: MANAGER_ASSIGNMENT_MESSAGES.ORDER_NOT_RESTARTABLE,
};

export type AssignableOrder = {
  orderId: number;
  pickup: GeoPoint;
  parcel: PackageSpec;
};

export type StaffOrder = AssignableOrder & {
  status: OrderStatus;
  courierId: number | null;
  round: number;
};

export function conflict(code: string, message: string, extra: object = {}): ConflictException {
  return new ConflictException({ statusCode: HttpStatus.CONFLICT, code, message, ...extra });
}

export async function loadStaffOrder(
  executor: Database | Transaction,
  orderId: number,
  rule: StaffOrderRule,
  lock: boolean,
): Promise<StaffOrder> {
  const query = executor
    .select({
      orderId: orders.orderId,
      status: orders.status,
      courierId: orders.courierId,
      round: orders.assignmentRound,
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

  if (!rule.statuses.includes(order.status)) {
    throw conflict(rule.code, rule.message);
  }

  return order;
}

export async function loadAssignableOrder(
  executor: Database | Transaction,
  orderId: number,
  lock: boolean,
): Promise<AssignableOrder> {
  const { pickup, parcel } = await loadStaffOrder(executor, orderId, ASSIGN_RULE, lock);

  return { orderId, pickup, parcel };
}

export function ensureExpectedCourier(order: StaffOrder, expectedCourierId: number | null): void {
  if (order.courierId !== expectedCourierId) {
    throw conflict(COURIER_CHANGED_CODE, MANAGER_ASSIGNMENT_MESSAGES.COURIER_CHANGED, {
      currentCourierId: order.courierId,
    });
  }
}

export function courierNotAvailable(reason: UnsuitableReason): ConflictException {
  return conflict(COURIER_NOT_AVAILABLE_CODE, MANAGER_ASSIGNMENT_MESSAGES.COURIER_NOT_AVAILABLE, {
    reason,
  });
}
