import type { VehicleType } from '@/shared/api';
import { VEHICLE_TYPE_ORDER } from '@/entities/courier';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import type { MapFilter } from '../config/map';
import { MANAGER_MAP_TEXTS as TEXTS } from '../config/texts';
import { vehicleIcon, vehicleLabel } from '../lib/vehicle';
import { useVehicleDraft } from '../model/useVehicleDraft';

type VehicleFilterPanelProps = {
  selected: readonly VehicleType[];
  state: MapFilter | null;
  search: string | null;
  committedCount: number | null;
  isSheet: boolean;
  onApply: (vehicleTypes: VehicleType[]) => void;
};

const LEGEND_CLASS = 'mb-2 text-caption font-semibold tracking-caps text-fg-secondary uppercase';

export function VehicleFilterPanel({
  selected,
  state,
  search,
  committedCount,
  isSheet,
  onApply,
}: VehicleFilterPanelProps) {
  const form = useVehicleDraft({ selected, state, search, committedCount });

  const applyButton = (
    <Button fullWidth={isSheet} onClick={() => onApply(form.draft)}>
      {form.count === null ? TEXTS.SHOW : TEXTS.showCouriers(form.count)}
    </Button>
  );
  const resetButton = (
    <Button variant={isSheet ? 'secondary' : 'text'} fullWidth={isSheet} onClick={form.reset}>
      {TEXTS.RESET}
    </Button>
  );

  return (
    <div className="flex flex-col text-fg">
      <div className={`flex flex-col gap-3 ${isSheet ? 'pb-4' : 'p-4'}`}>
        <fieldset className="flex flex-col gap-3">
          <legend className={isSheet ? 'sr-only' : LEGEND_CLASS}>
            {TEXTS.VEHICLE_FILTERS_LABEL}
          </legend>
          {VEHICLE_TYPE_ORDER.map((vehicleType) => {
            const Icon = vehicleIcon(vehicleType);

            return (
              <Checkbox
                key={vehicleType}
                checked={form.draft.includes(vehicleType)}
                onChange={() => form.toggle(vehicleType)}
                label={
                  <span className="inline-flex items-center gap-2">
                    <Icon
                      size={ICON_SIZE.MEDIUM}
                      weight={ICON_WEIGHT}
                      aria-hidden="true"
                      className="shrink-0 text-fg-secondary"
                    />
                    <span>{vehicleLabel(vehicleType)}</span>
                  </span>
                }
              />
            );
          })}
        </fieldset>
      </div>
      {isSheet ? (
        <div className="sticky bottom-0 -mx-4 flex flex-col gap-2 border-t border-border bg-surface px-4 pt-3">
          {applyButton}
          {resetButton}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 border-t border-border bg-surface-muted px-4 py-3">
          {resetButton}
          {applyButton}
        </div>
      )}
    </div>
  );
}
