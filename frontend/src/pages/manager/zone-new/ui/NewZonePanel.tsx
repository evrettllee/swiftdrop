import { fieldError, ZONE_FIELD } from '@/entities/zone';
import { OverlapNotes, RadiusField, SaveFailure } from '@/features/zone-draw';
import { ZONE_NAME_MAX_LENGTH } from '@/shared/staff-api';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Select } from '@/shared/ui/select';
import { Switch } from '@/shared/ui/switch';
import { MANAGER_ZONE_NEW_TEXTS as TEXTS } from '../config/texts';
import type { useNewZone } from '../model/useNewZone';

export function NewZonePanel({ page }: { page: ReturnType<typeof useNewZone> }) {
  const { params, draw, saving, errors } = page;
  const options = page.tariffs.map(({ id, name }) => ({ value: String(id), label: name }));

  return (
    <>
      <h2 className="text-heading-sm font-semibold max-lg:hidden">{TEXTS.PANEL}</h2>
      <Input
        label={TEXTS.NAME}
        value={params.name}
        maxLength={ZONE_NAME_MAX_LENGTH}
        error={errors.name ?? fieldError(saving.failure, ZONE_FIELD.NAME)}
        onChange={(event) => page.change({ name: event.target.value })}
      />
      {draw.radiusKm === null ? null : (
        <RadiusField
          radiusKm={draw.radiusKm}
          onRadius={draw.setRadiusKm}
          onToPoints={draw.toPoints}
        />
      )}
      {page.tariffId === null ? null : (
        <Select
          label={TEXTS.TARIFF}
          options={options}
          value={String(page.tariffId)}
          error={fieldError(saving.failure, ZONE_FIELD.TARIFF)}
          onChange={(value) => page.change({ tariffId: Number(value) })}
        />
      )}
      <Input
        label={TEXTS.PRIORITY}
        value={params.priority}
        inputMode="numeric"
        hint={TEXTS.PRIORITY_HINT}
        error={errors.priority}
        onChange={(event) => page.change({ priority: event.target.value })}
      />
      <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
        <span>{TEXTS.ACTIVE}</span>
        <Switch
          isOn={params.isActive}
          label={TEXTS.ACTIVE}
          onChange={(isActive) => page.change({ isActive })}
        />
      </div>
      <OverlapNotes notes={page.notes} />
      <SaveFailure failure={saving.failure} onRetry={() => void page.save()} />
      <div className="flex flex-col gap-4 pt-4">
        <Button fullWidth loading={saving.isSaving} onClick={() => void page.save()}>
          {TEXTS.SAVE}
        </Button>
        <Button variant="secondary" fullWidth onClick={page.cancel}>
          {TEXTS.CANCEL}
        </Button>
      </div>
    </>
  );
}
