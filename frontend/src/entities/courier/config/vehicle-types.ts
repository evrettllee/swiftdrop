import {
  BicycleIcon,
  CarIcon,
  type Icon,
  PersonSimpleWalkIcon,
  ScooterIcon,
  TruckIcon,
} from '@phosphor-icons/react';
import { VEHICLE_TYPE, type VehicleType } from '@/shared/api';

type VehicleTypeMeta = {
  label: string;
  icon: Icon;
};

// How a type of transport is named and drawn in the cabinet: the vehicle form and the work page.
export const VEHICLE_TYPE_META: Record<VehicleType, VehicleTypeMeta> = {
  [VEHICLE_TYPE.FOOT]: { label: 'Пешком', icon: PersonSimpleWalkIcon },
  [VEHICLE_TYPE.BICYCLE]: { label: 'Велосипед', icon: BicycleIcon },
  [VEHICLE_TYPE.SCOOTER]: { label: 'Самокат', icon: ScooterIcon },
  [VEHICLE_TYPE.CAR]: { label: 'Легковой', icon: CarIcon },
  [VEHICLE_TYPE.TRUCK]: { label: 'Грузовой', icon: TruckIcon },
};

// From the lightest to the heaviest transport.
export const VEHICLE_TYPE_ORDER: readonly VehicleType[] = [
  VEHICLE_TYPE.FOOT,
  VEHICLE_TYPE.BICYCLE,
  VEHICLE_TYPE.SCOOTER,
  VEHICLE_TYPE.CAR,
  VEHICLE_TYPE.TRUCK,
];
