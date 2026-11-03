import { type Icon, UserIcon } from '@phosphor-icons/react';
import { STAFF_VEHICLE_LABELS, VEHICLE_TYPE_META } from '@/entities/courier';
import type { VehicleType } from '@/shared/api';
import { MANAGER_MAP_TEXTS } from '../config/texts';

export function vehicleLabel(vehicleType: VehicleType | null): string {
  return vehicleType === null ? MANAGER_MAP_TEXTS.NO_VEHICLE : STAFF_VEHICLE_LABELS[vehicleType];
}

export function vehicleIcon(vehicleType: VehicleType | null): Icon {
  return vehicleType === null ? UserIcon : VEHICLE_TYPE_META[vehicleType].icon;
}
