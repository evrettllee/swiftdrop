import type { VehicleType } from '@/common/enums/vehicle-type.enum';

export type CourierLookupRow = {
  courierId: number;
  firstName: string;
  lastName: string;
  vehicleType: VehicleType | null;
};

export type CourierLookupItem = {
  courierId: number;
  name: string;
  vehicleType: VehicleType | null;
};
