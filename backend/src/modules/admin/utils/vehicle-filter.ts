import { and, eq, inArray, or, type SQL, sql } from 'drizzle-orm';
import type { VehicleType } from '@/common/enums/vehicle-type.enum';
import { courierProfiles, users, vehicles } from '@/database/schema';
import { VEHICLE_FILTER_NONE } from '../constants/admin-users.constants';
import type { AdminVehicleFilter } from '../types/admin-users.types';

function isVehicleType(value: AdminVehicleFilter): value is VehicleType {
  return value !== VEHICLE_FILTER_NONE;
}

function courierVehicles(condition: SQL | undefined): SQL {
  return sql`select 1 from ${courierProfiles} inner join ${vehicles} on ${eq(vehicles.courierProfileId, courierProfiles.courierProfileId)} where ${and(eq(courierProfiles.userId, users.userId), condition)}`;
}

export function vehicleCondition(filter: readonly AdminVehicleFilter[] | null): SQL | undefined {
  if (filter === null) {
    return undefined;
  }

  const types = filter.filter(isVehicleType);
  const withType =
    types.length > 0 ? sql`exists (${courierVehicles(inArray(vehicles.type, types))})` : undefined;
  const withoutVehicle = filter.includes(VEHICLE_FILTER_NONE)
    ? sql`not exists (${courierVehicles(undefined)})`
    : undefined;

  return or(withType, withoutVehicle);
}
