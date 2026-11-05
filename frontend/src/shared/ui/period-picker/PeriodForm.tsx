import { useId } from 'react';
import { Button } from '@/shared/ui/button';
import { DateField } from '@/shared/ui/date-field';
import { RadioCard } from '@/shared/ui/radio-card';

export type PeriodFormLayout = 'panel' | 'sheet';

export type PeriodDraftOf<P extends string> = { preset: P; from: string | null; to: string | null };

export type PeriodFormTexts = {
  legend: string;
  from: string;
  to: string;
  invalid: string;
  apply: string;
  reset: string;
};

type PeriodFormProps<P extends string> = {
  layout: PeriodFormLayout;
  presets: readonly { value: P; label: string }[];
  customValue: P;
  draft: PeriodDraftOf<P>;
  isValid: boolean;
  texts: PeriodFormTexts;
  onChange: (patch: Partial<PeriodDraftOf<P>>) => void;
  onApply: () => void;
  onReset: () => void;
};

export function PeriodForm<P extends string>({
  layout,
  presets,
  customValue,
  draft,
  isValid,
  texts,
  onChange,
  onApply,
  onReset,
}: PeriodFormProps<P>) {
  const name = useId();
  const isSheet = layout === 'sheet';
  const applyButton = (
    <Button fullWidth={isSheet} disabled={!isValid} onClick={onApply}>
      {texts.apply}
    </Button>
  );
  const resetButton = (
    <Button variant={isSheet ? 'secondary' : 'text'} fullWidth={isSheet} onClick={onReset}>
      {texts.reset}
    </Button>
  );

  return (
    <div className="flex flex-col">
      <div className={`flex flex-col gap-4 ${isSheet ? 'pb-4' : 'p-4'}`}>
        <fieldset className="flex flex-col gap-2">
          <legend
            className={
              isSheet ? 'sr-only' : 'mb-2 text-caption font-semibold text-fg-secondary uppercase'
            }
          >
            {texts.legend}
          </legend>
          {presets.map((preset) => (
            <RadioCard
              key={preset.value}
              name={name}
              value={preset.value}
              density="compact"
              title={preset.label}
              checked={draft.preset === preset.value}
              onChange={() => onChange({ preset: preset.value })}
            />
          ))}
        </fieldset>
        {draft.preset === customValue ? (
          <div className="grid grid-cols-2 gap-3">
            <DateField
              label={texts.from}
              value={draft.from}
              onChange={(from) => onChange({ from })}
              error={isValid ? undefined : texts.invalid}
            />
            <DateField label={texts.to} value={draft.to} onChange={(to) => onChange({ to })} />
          </div>
        ) : null}
      </div>
      {isSheet ? (
        <div className="sticky bottom-0 -mx-4 flex flex-col gap-2 border-t border-border bg-surface px-4 pt-3">
          {applyButton}
          {resetButton}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
          {resetButton}
          {applyButton}
        </div>
      )}
    </div>
  );
}
