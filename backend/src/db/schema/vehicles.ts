import { integer, pgEnum, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';
import { courierProfiles } from './courier-profiles';

export const vehicleTypeEnum = pgEnum('vehicle_type', [
  'foot',
  'bicycle',
  'scooter',
  'car',
  'truck',
]);

export const vehicles = pgTable('vehicles', {
  vehicleId: integer().primaryKey().generatedAlwaysAsIdentity(),
  courierProfileId: integer()
    .notNull()
    .unique()
    .references(() => courierProfiles.courierProfileId),
  type: vehicleTypeEnum().notNull(),
  brand: varchar({ length: 100 }),
  model: varchar({ length: 100 }),
  licensePlate: varchar({ length: 20 }),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
