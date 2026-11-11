import { STAFF_VEHICLE_LABELS, VEHICLE_TYPE_ORDER } from '@/entities/courier';
import type { VehicleType } from '@/shared/api';
import { ToggleChip } from '@/shared/ui/chip';
import { MANAGER_MAP_TEXTS as TEXTS } from '../config/texts';
import { toggleVehicleType } from '../lib/vehicle';

type VehicleChipsProps = {
  value: readonly VehicleType[];
  onChange: (value: VehicleType[]) => void;
};

export function VehicleChips({ value, onChange }: VehicleChipsProps) {
  return (
    <div
      role="group"
      aria-label={TEXTS.VEHICLE_FILTERS_LABEL}
      className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0"
    >
      {VEHICLE_TYPE_ORDER.map((vehicleType) => (
        <ToggleChip
          key={vehicleType}
          label={STAFF_VEHICLE_LABELS[vehicleType]}
          isPressed={value.includes(vehicleType)}
          onClick={() => onChange(toggleVehicleType(value, vehicleType))}
        />
      ))}
    </div>
  );
}
