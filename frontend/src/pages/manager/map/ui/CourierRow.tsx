import { memo } from 'react';
import type { VehicleType } from '@/shared/api';
import { COLOR_TRANSITION_CLASS } from '@/shared/config';
import { joinClassNames } from '@/shared/lib/class-names';
import { getNameInitials } from '@/shared/lib/format';
import type { CourierMapState } from '@/shared/staff-api';
import { Avatar } from '@/shared/ui/avatar';
import { vehicleLabel } from '../lib/vehicle';
import { StateMark } from './StateMark';

type CourierRowProps = {
  courierId: number;
  name: string;
  vehicleType: VehicleType | null;
  state: CourierMapState;
  stateText: string;
  isSelected: boolean;
  onSelect: (courierId: number) => void;
};

export const CourierRow = memo(function CourierRow({
  courierId,
  name,
  vehicleType,
  state,
  stateText,
  isSelected,
  onSelect,
}: CourierRowProps) {
  return (
    <li>
      <button
        type="button"
        aria-pressed={isSelected}
        onClick={() => onSelect(courierId)}
        className={joinClassNames(
          'flex min-h-14 w-full items-center gap-3 rounded-md p-2 text-start',
          COLOR_TRANSITION_CLASS,
          isSelected ? 'bg-selected' : 'hover:bg-surface-muted',
        )}
      >
        <Avatar initials={getNameInitials(name)} size="small" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate leading-5">{name}</span>
          <span className="truncate text-small leading-5 text-fg-secondary">
            {vehicleLabel(vehicleType)}
          </span>
        </span>
        <StateMark state={state} text={stateText} />
      </button>
    </li>
  );
});
