import {
  BicycleIcon,
  CarIcon,
  type Icon,
  PersonSimpleWalkIcon,
  ScooterIcon,
  TruckIcon,
} from '@phosphor-icons/react';
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

type VehicleTypeOption = {
  type: VehicleType;
  label: string;
  icon: Icon;
};

// The cards of the form, from the lightest to the heaviest transport.
export const VEHICLE_TYPE_OPTIONS: readonly VehicleTypeOption[] = [
  { type: VEHICLE_TYPE.FOOT, label: 'Пешком', icon: PersonSimpleWalkIcon },
  { type: VEHICLE_TYPE.BICYCLE, label: 'Велосипед', icon: BicycleIcon },
  { type: VEHICLE_TYPE.SCOOTER, label: 'Самокат', icon: ScooterIcon },
  { type: VEHICLE_TYPE.CAR, label: 'Легковой', icon: CarIcon },
  { type: VEHICLE_TYPE.TRUCK, label: 'Грузовой', icon: TruckIcon },
];
