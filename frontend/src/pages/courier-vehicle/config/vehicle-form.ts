import { VEHICLE_TYPE, type VehicleType } from '@/shared/api';

// The names of the fields: the same as the fields of the request, so the errors of the backend
// land under them.
export const VEHICLE_FIELD = {
  TYPE: 'type',
  BRAND: 'brand',
  MODEL: 'model',
  LICENSE_PLATE: 'licensePlate',
} as const;

// The rules of the backend (update-vehicle.dto.ts, VEHICLE_FIELD_LENGTH); must match them.
export const VEHICLE_FIELD_LENGTH = {
  BRAND: 100,
  MODEL: 100,
  LICENSE_PLATE: 20,
} as const;

export const VEHICLE_TEXT_MIN_LENGTH = 1;
export const LICENSE_PLATE_MIN_LENGTH = 4;
// Letters, digits, spaces and hyphens, starting and ending with a letter or a digit (1234 AB-7).
export const LICENSE_PLATE_PATTERN = /^[0-9A-ZА-ЯЁ](?:[0-9A-ZА-ЯЁ -]*[0-9A-ZА-ЯЁ])?$/u;

// Only these need a brand, a model and a plate: a courier on foot, a bike or a scooter has none.
export const VEHICLES_WITH_REGISTRATION: readonly VehicleType[] = [
  VEHICLE_TYPE.CAR,
  VEHICLE_TYPE.TRUCK,
];
