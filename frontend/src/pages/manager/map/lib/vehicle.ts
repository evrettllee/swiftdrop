import { type Icon, UserIcon } from '@phosphor-icons/react';
import { STAFF_VEHICLE_LABELS, VEHICLE_TYPE_META, VEHICLE_TYPE_ORDER } from '@/entities/courier';
import type { VehicleType } from '@/shared/api';
import type { AppliedFilterChip } from '@/shared/ui/chip';
import { MANAGER_MAP_TEXTS } from '../config/texts';

export function vehicleLabel(vehicleType: VehicleType | null): string {
  return vehicleType === null ? MANAGER_MAP_TEXTS.NO_VEHICLE : STAFF_VEHICLE_LABELS[vehicleType];
}

export function vehicleIcon(vehicleType: VehicleType | null): Icon {
  return vehicleType === null ? UserIcon : VEHICLE_TYPE_META[vehicleType].icon;
}

export function toggleVehicleType(
  selected: readonly VehicleType[],
  vehicleType: VehicleType,
): VehicleType[] {
  const isOn = !selected.includes(vehicleType);

  return VEHICLE_TYPE_ORDER.filter((item) =>
    item === vehicleType ? isOn : selected.includes(item),
  );
}

export function removeVehicleType(
  selected: readonly VehicleType[],
  vehicleType: VehicleType,
): VehicleType[] {
  return selected.filter((item) => item !== vehicleType);
}

export function vehicleAppliedFilters(
  selected: readonly VehicleType[],
): AppliedFilterChip<VehicleType>[] {
  return VEHICLE_TYPE_ORDER.filter((item) => selected.includes(item)).map((vehicleType) => ({
    id: vehicleType,
    name: MANAGER_MAP_TEXTS.VEHICLE_FILTERS_LABEL,
    value: STAFF_VEHICLE_LABELS[vehicleType],
  }));
}
