import { COLOR_TRANSITION_CLASS } from '@/shared/config';
import type { ManagerZone } from '@/shared/staff-api';
import { ZONE_ROW_TEXTS } from '../config/texts';
import { ZoneMark } from './ZoneMark';

type ZoneNameProps = {
  zone: ManagerZone;
  isSelected: boolean;
  onSelect: (zoneId: number) => void;
};

export function ZoneName({ zone, isSelected, onSelect }: ZoneNameProps) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      aria-label={ZONE_ROW_TEXTS.select(zone.name)}
      onClick={() => onSelect(zone.id)}
      className={`-mx-1 inline-flex min-h-11 items-center gap-2 rounded-sm px-1 text-start font-semibold hover:text-accent ${COLOR_TRANSITION_CLASS}`}
    >
      <ZoneMark isActive={zone.isActive} />
      <span aria-hidden="true">{zone.name}</span>
    </button>
  );
}
