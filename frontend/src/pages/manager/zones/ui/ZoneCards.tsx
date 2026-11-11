import { ZONE_ROW_TEXTS } from '../config/texts';
import { zoneArea, zoneUpdatedDay } from '../lib/zone-format';
import { ZoneEditLink } from './ZoneEditLink';
import { ZoneName } from './ZoneName';
import { ZoneStatusSwitch } from './ZoneStatusSwitch';
import type { ZoneListProps } from './ZonesTable';

export function ZoneCards({ zones, selectedId, isPending, onSelect, onToggle }: ZoneListProps) {
  return (
    <ul className="flex flex-col gap-4">
      {zones.map((zone) => (
        <li
          key={zone.id}
          className={`flex flex-col gap-2 rounded-lg p-4 shadow-md dark:border dark:border-border ${zone.id === selectedId ? 'bg-selected' : 'bg-surface'}`}
        >
          <div className="flex items-center justify-between gap-3">
            <ZoneName zone={zone} isSelected={zone.id === selectedId} onSelect={onSelect} />
            <ZoneEditLink zone={zone} />
          </div>
          <div className="flex flex-col text-small">
            <span>{ZONE_ROW_TEXTS.tariff(zone.tariff.name)}</span>
            <span className="text-fg-secondary tabular-nums">
              {ZONE_ROW_TEXTS.facts(zone.priority, zoneArea(zone), zoneUpdatedDay(zone))}
            </span>
          </div>
          <ZoneStatusSwitch zone={zone} isPending={isPending(zone.id)} onToggle={onToggle} />
        </li>
      ))}
    </ul>
  );
}
