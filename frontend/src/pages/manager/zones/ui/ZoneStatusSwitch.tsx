import type { ManagerZone } from '@/shared/staff-api';
import { Switch } from '@/shared/ui/switch';
import { ZONE_ROW_TEXTS } from '../config/texts';

type ZoneStatusSwitchProps = {
  zone: ManagerZone;
  isPending: boolean;
  onToggle: (zone: ManagerZone, isActive: boolean) => void;
};

export function ZoneStatusSwitch({ zone, isPending, onToggle }: ZoneStatusSwitchProps) {
  return (
    <Switch
      isOn={zone.isActive}
      label={ZONE_ROW_TEXTS.switchLabel(zone.name)}
      disabled={isPending}
      className="text-fg-secondary"
      onChange={(isOn) => onToggle(zone, isOn)}
    >
      {zone.isActive ? ZONE_ROW_TEXTS.ON : ZONE_ROW_TEXTS.OFF}
    </Switch>
  );
}
