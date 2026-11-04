import { ClockIcon } from '@phosphor-icons/react';
import { useId } from 'react';
import { DateField } from '@/shared/ui/date-field';
import { FieldError } from '@/shared/ui/field-error';
import { Select, SELECT_LABEL } from '@/shared/ui/select';
import { ANALYTICS_PERIOD, type AnalyticsPeriod } from '../config/analytics';
import { PERIOD_TEXTS } from '../config/texts';
import type { PeriodControl as Period } from '../model/useAnalyticsPeriod';

const PERIOD_OPTIONS: readonly { value: AnalyticsPeriod; label: string }[] = [
  { value: ANALYTICS_PERIOD.WEEK, label: PERIOD_TEXTS.WEEK },
  { value: ANALYTICS_PERIOD.MONTH, label: PERIOD_TEXTS.MONTH },
  { value: ANALYTICS_PERIOD.QUARTER, label: PERIOD_TEXTS.QUARTER },
  { value: ANALYTICS_PERIOD.CUSTOM, label: PERIOD_TEXTS.CUSTOM },
];

type PeriodControlProps = {
  period: Period;
};

export function PeriodControl({ period }: PeriodControlProps) {
  const errorId = useId();
  const { values, error } = period;
  const invalid = error === null ? {} : { 'aria-invalid': true, 'aria-describedby': errorId };

  return (
    <div className="flex flex-col gap-3 lg:w-80 lg:items-end">
      <Select
        label={PERIOD_TEXTS.LABEL}
        labelMode={SELECT_LABEL.HIDDEN}
        icon={ClockIcon}
        options={PERIOD_OPTIONS}
        value={values.period}
        onChange={period.setPeriod}
        className="w-full lg:w-56"
      />
      {values.period === ANALYTICS_PERIOD.CUSTOM ? (
        <div className="flex w-full flex-col gap-2">
          <div className="grid grid-cols-2 gap-3">
            <DateField
              label={PERIOD_TEXTS.FROM}
              value={values.from}
              onChange={period.setFrom}
              {...invalid}
            />
            <DateField
              label={PERIOD_TEXTS.TO}
              value={values.to}
              onChange={period.setTo}
              {...invalid}
            />
          </div>
          {error === null ? null : <FieldError id={errorId}>{error}</FieldError>}
        </div>
      ) : null}
    </div>
  );
}
