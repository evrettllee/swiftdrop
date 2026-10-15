import { type ChangeEvent, useId } from 'react';
import { ID_PART } from '@/shared/config';
import { FieldError } from '@/shared/ui/field-error';
import { RadioCard } from '@/shared/ui/radio-card';
import { COURIER_VEHICLE_TEXTS } from '../config/texts';
import { VEHICLE_LIMITS, VEHICLE_TYPE_OPTIONS } from '../config/vehicle-types';

type VehicleTypeFieldsetProps = {
  name: string;
  value: string;
  error?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
};

// The type of the transport: one card per type, with its weight limit.
export function VehicleTypeFieldset({
  name,
  value,
  error,
  onChange,
  onBlur,
}: VehicleTypeFieldsetProps) {
  const errorId = `${useId()}-${ID_PART.ERROR}`;
  const hasError = error !== undefined;

  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className="mb-2 text-caption tracking-caps text-fg-secondary uppercase">
        {COURIER_VEHICLE_TEXTS.TYPE_LEGEND}
      </legend>
      {VEHICLE_TYPE_OPTIONS.map((option) => {
        const limit = VEHICLE_LIMITS[option.type];

        return (
          <RadioCard
            key={option.type}
            name={name}
            value={option.type}
            checked={value === option.type}
            onChange={onChange}
            onBlur={onBlur}
            aria-invalid={hasError}
            aria-describedby={hasError ? errorId : undefined}
            icon={option.icon}
            title={option.label}
            description={limit.allowsFragile ? undefined : COURIER_VEHICLE_TEXTS.NO_FRAGILE}
            aside={COURIER_VEHICLE_TEXTS.weightLimit(limit.maxWeightKg)}
          />
        );
      })}
      {hasError ? <FieldError id={errorId}>{error}</FieldError> : null}
    </fieldset>
  );
}
