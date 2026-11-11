import { integer, pgEnum, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';
import { VEHICLE_TYPE_VALUES } from '@/common/enums/vehicle-type.enum';
import { courierProfiles } from './courier-profiles';
import { VEHICLE_FIELD_LENGTH } from '@/common/constants/field-lengths.constants';

export const vehicleTypeEnum = pgEnum('vehicle_type', VEHICLE_TYPE_VALUES);

export const vehicles = pgTable('vehicles', {
  vehicleId: integer().primaryKey().generatedAlwaysAsIdentity(),
  courierProfileId: integer()
    .notNull()
    .unique()
    .references(() => courierProfiles.courierProfileId),
  type: vehicleTypeEnum().notNull(),
  brand: varchar({ length: VEHICLE_FIELD_LENGTH.BRAND }),
  model: varchar({ length: VEHICLE_FIELD_LENGTH.MODEL }),
  licensePlate: varchar({ length: VEHICLE_FIELD_LENGTH.LICENSE_PLATE }),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
