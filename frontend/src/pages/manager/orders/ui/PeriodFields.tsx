import { DateField } from '@/shared/ui/date-field';
import { Select } from '@/shared/ui/select';
import { PERIOD_PRESET, type PeriodPreset } from '../config/list';
import { FILTER_TEXTS, PERIOD_LABELS } from '../config/texts';
import type { FilterDraft } from '../model/filter-draft';

const PERIOD_PRESETS: readonly PeriodPreset[] = [
  PERIOD_PRESET.ALL,
  PERIOD_PRESET.WEEK,
  PERIOD_PRESET.MONTH,
  PERIOD_PRESET.CUSTOM,
];

const PERIOD_OPTIONS = PERIOD_PRESETS.map((preset) => ({
  value: preset,
  label: PERIOD_LABELS[preset],
}));

type PeriodFieldsProps = {
  draft: FilterDraft;
  isValid: boolean;
  onChange: (patch: Partial<FilterDraft>) => void;
};

export function PeriodFields({ draft, isValid, onChange }: PeriodFieldsProps) {
  return (
    <div className="flex flex-col gap-4">
      <Select
        label={FILTER_TEXTS.PERIOD}
        options={PERIOD_OPTIONS}
        value={draft.preset}
        onChange={(preset) => onChange({ preset })}
      />
      {draft.preset === PERIOD_PRESET.CUSTOM ? (
        <div className="grid grid-cols-2 gap-3">
          <DateField
            label={FILTER_TEXTS.PERIOD_FROM}
            value={draft.from}
            onChange={(from) => onChange({ from })}
            error={isValid ? undefined : FILTER_TEXTS.PERIOD_INVALID}
          />
          <DateField
            label={FILTER_TEXTS.PERIOD_TO}
            value={draft.to}
            onChange={(to) => onChange({ to })}
          />
        </div>
      ) : null}
    </div>
  );
}
