import type { VehicleType } from '@/common/enums/vehicle-type.enum';

export type CourierVehicle = {
  type: VehicleType;
  brand: string | null;
  model: string | null;
  licensePlate: string | null;
};

// What the courier cabinet needs on opening.
export type CourierMe = {
  isAvailable: boolean;
  vehicle: CourierVehicle | null;
  activeOrderId: number | null;
};

// A profile held by its row lock for the rest of a transaction.
export type LockedProfile = {
  courierProfileId: number;
  isAvailable: boolean;
};

// A profile row joined with its vehicle: the vehicle columns are null when there is none.
export type CourierProfileRow = {
  courierProfileId: number;
  isAvailable: boolean;
  vehicleType: VehicleType | null;
  brand: string | null;
  model: string | null;
  licensePlate: string | null;
};

export type CourierShiftEvent = {
  courierProfileId: number;
  isAvailable: boolean;
};
