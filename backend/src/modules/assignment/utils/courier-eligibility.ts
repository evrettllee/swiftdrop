import {
  and,
  eq,
  gte,
  inArray,
  isNotNull,
  isNull,
  not,
  notExists,
  type SQL,
  sql,
} from 'drizzle-orm';
import { courierActiveOrder } from '@/common/database/courier-active-order';
import type { PackageSpec } from '@/common/schemas/package-spec.schema';
import type { Database } from '@/database/database.module';
import { courierProfiles, orders, users, vehicles } from '@/database/schema';
import { COURIER_LOCATION_FRESH_MS } from '../constants/assignment.constants';
import { vehiclesThatCarry } from './vehicle-routing';

export type CourierEligibility = {
  onShift: SQL;
  freshLocation: SQL;
  free: SQL;
  hasVehicle: SQL;
  vehicleFits: SQL;
};

export function courierEligibility(
  db: Database,
  parcel: PackageSpec,
  now: Date,
): CourierEligibility {
  const freshSince = new Date(now.getTime() - COURIER_LOCATION_FRESH_MS);

  return {
    onShift: eq(courierProfiles.isAvailable, true),
    freshLocation: gte(courierProfiles.locationUpdatedAt, freshSince),
    free: notExists(
      db
        .select({ orderId: orders.orderId })
        .from(orders)
        .where(courierActiveOrder(courierProfiles.courierProfileId)),
    ),
    hasVehicle: isNotNull(vehicles.vehicleId),
    vehicleFits: inArray(vehicles.type, vehiclesThatCarry(parcel)),
  };
}

export function eligibleCourier(eligibility: CourierEligibility): SQL {
  return sql`(${and(...Object.values(eligibility))})`;
}

export function ineligibleCourier(eligibility: CourierEligibility): SQL {
  return not(and(...Object.values(eligibility).map(isTrue)) ?? sql`true`);
}

export function isTrue(condition: SQL): SQL<boolean> {
  return sql<boolean>`coalesce(${condition}, false)`;
}

export const courierAccountActive: SQL = sql`(${and(eq(users.isBlocked, false), isNull(users.deletedAt))})`;
