import type { VehicleLimit } from '@/common/types/vehicle.types';
import type { VehicleType } from '@/common/enums/vehicle-type.enum';

export const VEHICLE_LIMITS: Record<VehicleType, VehicleLimit> = {
  foot: { maxWeightKg: 3, maxSidesCm: [40, 30, 20], allowsFragile: true },
  bicycle: { maxWeightKg: 5, maxSidesCm: [50, 40, 30], allowsFragile: false },
  scooter: { maxWeightKg: 10, maxSidesCm: [60, 40, 30], allowsFragile: true },
  car: { maxWeightKg: 30, maxSidesCm: [100, 60, 50], allowsFragile: true },
  truck: { maxWeightKg: 500, maxSidesCm: [200, 120, 120], allowsFragile: true },
};
