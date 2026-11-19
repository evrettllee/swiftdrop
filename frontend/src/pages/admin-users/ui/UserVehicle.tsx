import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import type { VehicleType } from '@/shared/api';
import { vehicleView } from '../lib/labels';

export function UserVehicle({ type }: { type: VehicleType | null | undefined }) {
  const { label, icon: VehicleIcon, isMissing } = vehicleView(type);

  return (
    <span
      className={`inline-flex items-center gap-2 whitespace-nowrap ${isMissing ? 'text-fg-secondary' : ''}`}
    >
      <VehicleIcon
        size={ICON_SIZE.MEDIUM}
        weight={ICON_WEIGHT}
        aria-hidden="true"
        className="shrink-0 text-fg-secondary"
      />
      {label}
    </span>
  );
}
