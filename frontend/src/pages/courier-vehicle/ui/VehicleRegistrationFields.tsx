import { type ChangeEvent, useId } from 'react';
import { Input } from '@/shared/ui/input';
import { COURIER_VEHICLE_TEXTS } from '../config/texts';
import { VEHICLE_FIELD } from '../config/vehicle-form';

type FieldProps = {
  name: string;
  value: string;
  error: string | undefined;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
};

type VehicleRegistrationFieldsProps = {
  field: (name: string) => FieldProps;
};

// The brand, the model and the plate of a car or a truck. On the desktop they share a grid of two
// columns: the brand and the model fill the first row, the plate takes one column of the second.
export function VehicleRegistrationFields({ field }: VehicleRegistrationFieldsProps) {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-4">
      <h2 id={titleId} className="text-heading-sm font-semibold">
        {COURIER_VEHICLE_TEXTS.REGISTRATION_TITLE}
      </h2>
      <div className="grid gap-4 lg:grid-cols-2 lg:gap-x-6">
        <Input
          {...field(VEHICLE_FIELD.BRAND)}
          label={COURIER_VEHICLE_TEXTS.BRAND}
          autoComplete="off"
        />
        <Input
          {...field(VEHICLE_FIELD.MODEL)}
          label={COURIER_VEHICLE_TEXTS.MODEL}
          autoComplete="off"
        />
        <Input
          {...field(VEHICLE_FIELD.LICENSE_PLATE)}
          label={COURIER_VEHICLE_TEXTS.LICENSE_PLATE}
          hint={COURIER_VEHICLE_TEXTS.LICENSE_PLATE_HINT}
          autoComplete="off"
          spellCheck={false}
        />
      </div>
    </section>
  );
}
