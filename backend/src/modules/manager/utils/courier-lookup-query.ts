import { and, asc, eq, isNull } from 'drizzle-orm';
import type { Database } from '@/database/database.module';
import { courierProfiles, users, vehicles } from '@/database/schema';
import type { CourierLookupDto } from '../dto/manager-courier-lookup.dto';
import { courierSearchCondition } from './courier-candidates-query';

export function courierLookupQuery(db: Database, { search, limit }: CourierLookupDto) {
  return db
    .select({
      courierId: courierProfiles.courierProfileId,
      firstName: users.firstName,
      lastName: users.lastName,
      vehicleType: vehicles.type,
    })
    .from(courierProfiles)
    .innerJoin(users, eq(users.userId, courierProfiles.userId))
    .leftJoin(vehicles, eq(vehicles.courierProfileId, courierProfiles.courierProfileId))
    .where(and(isNull(users.deletedAt), courierSearchCondition(search)))
    .orderBy(asc(users.lastName), asc(users.firstName), asc(courierProfiles.courierProfileId))
    .limit(limit);
}
