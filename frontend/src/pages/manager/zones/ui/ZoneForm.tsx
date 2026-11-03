import { PentagonIcon } from '@phosphor-icons/react';
import { useId, useMemo } from 'react';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { type ManagerZone, type TariffOption, ZONE_NAME_MAX_LENGTH } from '@/shared/staff-api';
import { Button } from '@/shared/ui/button';
import { FieldError } from '@/shared/ui/field-error';
import { Input } from '@/shared/ui/input';
import { Select } from '@/shared/ui/select';
import { Switch } from '@/shared/ui/switch';
import { EDIT_TEXTS } from '../config/texts';
import type { DraftErrors, ZoneDraft } from '../lib/zone-draft';
import { fieldError, ZONE_FIELD, type ZoneFailure } from '../lib/zone-failure';

type ZoneFormProps = {
  zone: ManagerZone;
  draft: ZoneDraft;
  tariffs: readonly TariffOption[];
  errors: DraftErrors;
  failure: ZoneFailure | null;
  onChange: (patch: Partial<ZoneDraft>) => void;
  onContour: () => void;
};

export function ZoneForm({
  zone,
  draft,
  tariffs,
  errors,
  failure,
  onChange,
  onContour,
}: ZoneFormProps) {
  const hintId = useId();
  const activeError = fieldError(failure, ZONE_FIELD.ACTIVE);
  const options = useMemo(() => {
    const list = tariffs.some(({ id }) => id === zone.tariff.id)
      ? tariffs
      : [zone.tariff, ...tariffs];

    return list.map(({ id, name }) => ({ value: String(id), label: name }));
  }, [tariffs, zone.tariff]);

  return (
    <div className="flex flex-col gap-4 text-fg">
      <Input
        label={EDIT_TEXTS.NAME}
        value={draft.name}
        maxLength={ZONE_NAME_MAX_LENGTH}
        error={errors.name ?? fieldError(failure, ZONE_FIELD.NAME)}
        onChange={(event) => onChange({ name: event.target.value })}
      />
      <div className="flex flex-col gap-2">
        <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
          <Select
            label={EDIT_TEXTS.TARIFF}
            options={options}
            value={String(draft.tariffId)}
            error={fieldError(failure, ZONE_FIELD.TARIFF)}
            onChange={(value) => onChange({ tariffId: Number(value) })}
          />
          <Input
            label={EDIT_TEXTS.PRIORITY}
            value={draft.priority}
            inputMode="numeric"
            error={errors.priority}
            onChange={(event) => onChange({ priority: event.target.value })}
          />
        </div>
        <p className="text-small text-pretty text-fg-secondary">{EDIT_TEXTS.PRIORITY_HINT}</p>
      </div>
      <div className="flex flex-col *:max-lg:w-full lg:items-start">
        <Button
          variant="secondary"
          icon={<PentagonIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />}
          onClick={onContour}
        >
          {EDIT_TEXTS.CONTOUR}
        </Button>
      </div>
      <div className="flex flex-col gap-2 border-t border-border pt-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span>{EDIT_TEXTS.ACTIVE}</span>
            <span id={hintId} className="text-small text-fg-secondary">
              {EDIT_TEXTS.ACTIVE_HINT}
            </span>
          </div>
          <Switch
            isOn={draft.isActive}
            label={EDIT_TEXTS.ACTIVE}
            describedBy={hintId}
            className="shrink-0 text-fg-secondary"
            onChange={(isActive) => onChange({ isActive })}
          >
            <span className="max-lg:hidden">{draft.isActive ? EDIT_TEXTS.ON : EDIT_TEXTS.OFF}</span>
          </Switch>
        </div>
        {activeError === undefined ? null : (
          <FieldError id={`${hintId}-error`}>{activeError}</FieldError>
        )}
      </div>
    </div>
  );
}
