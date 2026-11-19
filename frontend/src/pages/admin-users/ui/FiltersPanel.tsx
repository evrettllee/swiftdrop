import {
  ADMIN_VEHICLE_FILTERS,
  MANAGED_ROLE,
  USER_STATUS_FILTER_LABELS,
} from '../config/admin-user';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { ToggleChip } from '@/shared/ui/chip';
import type { UsersParams } from '../config/list-params';
import { ADMIN_USERS_TEXTS as TEXTS } from '../config/texts';
import { type FiltersDraft, useFiltersDraft } from '../model/useFiltersDraft';
import { statusOptions } from '../model/users-view';
import { VEHICLE_FILTER_LABELS } from '../config/vehicle-labels';

const CAPTION_CLASS = 'text-caption font-semibold tracking-wide text-fg-secondary uppercase';

type FiltersPanelProps = {
  values: UsersParams;
  isSheet: boolean;
  onApply: (draft: FiltersDraft) => void;
};

export function FiltersPanel({ values, isSheet, onApply }: FiltersPanelProps) {
  const form = useFiltersDraft(values);
  const { draft } = form;

  const applyButton = (
    <Button fullWidth={isSheet} disabled={!form.canApply} onClick={() => onApply(draft)}>
      {form.count === null ? TEXTS.SHOW : TEXTS.show(values.role, form.count)}
    </Button>
  );
  const resetButton = (
    <Button variant={isSheet ? 'secondary' : 'text'} fullWidth={isSheet} onClick={form.reset}>
      {TEXTS.RESET}
    </Button>
  );

  return (
    <div className="flex flex-col text-fg">
      <div className={`flex flex-col gap-6 ${isSheet ? 'pb-4' : 'p-4'}`}>
        <fieldset className="flex flex-col gap-3">
          <legend className={`mb-2 ${CAPTION_CLASS}`}>{TEXTS.STATUS}</legend>
          {statusOptions(values.role).map((status) => (
            <Checkbox
              key={status}
              label={USER_STATUS_FILTER_LABELS[status]}
              checked={draft.status.includes(status)}
              onChange={() => form.toggleStatus(status)}
            />
          ))}
        </fieldset>
        {values.role === MANAGED_ROLE.COURIER ? (
          <div role="group" aria-labelledby="admin-users-vehicle" className="flex flex-col gap-3">
            <span id="admin-users-vehicle" className={CAPTION_CLASS}>
              {TEXTS.VEHICLE}
            </span>
            <div className="flex flex-wrap gap-2">
              {ADMIN_VEHICLE_FILTERS.map((vehicle) => (
                <ToggleChip
                  key={vehicle}
                  label={VEHICLE_FILTER_LABELS[vehicle]}
                  isPressed={draft.vehicle.includes(vehicle)}
                  hasCheck
                  onClick={() => form.toggleVehicle(vehicle)}
                />
              ))}
            </div>
          </div>
        ) : null}
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
