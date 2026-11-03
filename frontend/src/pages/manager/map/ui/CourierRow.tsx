import { getNameInitials } from '@/shared/lib/format';
import { COLOR_TRANSITION_CLASS } from '@/shared/config';
import { joinClassNames } from '@/shared/lib/class-names';
import { Avatar } from '@/shared/ui/avatar';
import type { LiveCourier } from '../lib/courier-state';
import { stateText } from '../lib/courier-view';
import { vehicleLabel } from '../lib/vehicle';
import { StateMark } from './StateMark';

type CourierRowProps = {
  courier: LiveCourier;
  now: number;
  isSelected: boolean;
  onSelect: (courierId: number) => void;
};

export function CourierRow({ courier, now, isSelected, onSelect }: CourierRowProps) {
  return (
    <li>
      <button
        type="button"
        aria-pressed={isSelected}
        onClick={() => onSelect(courier.courierId)}
        className={joinClassNames(
          'flex min-h-14 w-full items-center gap-3 rounded-md p-2 text-start',
          COLOR_TRANSITION_CLASS,
          isSelected ? 'bg-selected' : 'hover:bg-surface-muted',
        )}
      >
        <Avatar initials={getNameInitials(courier.name)} size="small" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate leading-5">{courier.name}</span>
          <span className="truncate text-small leading-5 text-fg-secondary">
            {vehicleLabel(courier.vehicleType)}
          </span>
        </span>
        <StateMark state={courier.state} text={stateText(courier, now)} />
      </button>
    </li>
  );
}
