import { VEHICLE_TYPE, type VehicleType } from '@/shared/api';

type VehicleLimit = {
  maxWeightKg: number;
  allowsFragile: boolean;
};

// The limits of the backend (VEHICLE_LIMITS) the cards tell the courier about; must match it.
export const VEHICLE_LIMITS: Record<VehicleType, VehicleLimit> = {
  [VEHICLE_TYPE.FOOT]: { maxWeightKg: 3, allowsFragile: true },
  [VEHICLE_TYPE.BICYCLE]: { maxWeightKg: 5, allowsFragile: false },
  [VEHICLE_TYPE.SCOOTER]: { maxWeightKg: 10, allowsFragile: true },
  [VEHICLE_TYPE.CAR]: { maxWeightKg: 30, allowsFragile: true },
  [VEHICLE_TYPE.TRUCK]: { maxWeightKg: 500, allowsFragile: true },
};
