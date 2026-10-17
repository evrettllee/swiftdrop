import { z } from 'zod';

export const COURIERS_API_PATHS = {
  ME: '/couriers/me',
  VEHICLE: '/couriers/me/vehicle',
  AVAILABILITY: '/couriers/me/availability',
  STATS_TODAY: '/couriers/me/stats/today',
} as const;

// Must match the vehicle types of the backend, from the lightest to the heaviest.
export const VEHICLE_TYPE = {
  FOOT: 'foot',
  BICYCLE: 'bicycle',
  SCOOTER: 'scooter',
  CAR: 'car',
  TRUCK: 'truck',
} as const;

export type VehicleType = (typeof VEHICLE_TYPE)[keyof typeof VEHICLE_TYPE];

export const courierVehicleSchema = z.object({
  type: z.enum(VEHICLE_TYPE),
  brand: z.string().nullable(),
  model: z.string().nullable(),
  licensePlate: z.string().nullable(),
});

export type CourierVehicle = z.infer<typeof courierVehicleSchema>;

// What the courier cabinet needs on opening: whether the courier is on the line, their vehicle and
// the order they are delivering.
export const courierMeSchema = z.object({
  isAvailable: z.boolean(),
  vehicle: courierVehicleSchema.nullable(),
  activeOrderId: z.number().nullable(),
});

export type CourierMe = z.infer<typeof courierMeSchema>;

// The results of the day of the courier, counted from midnight in Minsk.
export const courierTodayStatsSchema = z.object({
  delivered: z.number(),
  distanceKm: z.number(),
  offersReceived: z.number(),
  offersAccepted: z.number(),
  // Null until the reviews exist.
  rating: z.number().nullable(),
});

export type CourierTodayStats = z.infer<typeof courierTodayStatsSchema>;
