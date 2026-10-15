import type { CourierVehicle } from '@/shared/api';
import { Button } from '@/shared/ui/button';
import { InlineAlert } from '@/shared/ui/inline-alert';
import { COURIER_VEHICLE_TEXTS } from '../config/texts';
import { VEHICLE_FIELD, VEHICLES_WITH_REGISTRATION } from '../config/vehicle-form';
import { useVehicleForm } from '../model/useVehicleForm';
import { VehicleRegistrationFields } from './VehicleRegistrationFields';
import { VehicleTypeFieldset } from './VehicleTypeFieldset';

type VehicleFormProps = {
  vehicle: CourierVehicle | null;
};

function hasRegistration(type: string): boolean {
  return VEHICLES_WITH_REGISTRATION.some((vehicleType) => vehicleType === type);
}

export function VehicleForm({ vehicle }: VehicleFormProps) {
  const { formRef, values, field, formError, isSubmitting, handleSubmit } = useVehicleForm(vehicle);
  const type = values[VEHICLE_FIELD.TYPE] ?? '';

  return (
    <form ref={formRef} noValidate onSubmit={handleSubmit} className="flex flex-col gap-6 lg:gap-8">
      <VehicleTypeFieldset {...field(VEHICLE_FIELD.TYPE)} />
      {hasRegistration(type) ? <VehicleRegistrationFields field={field} /> : null}
      <div className="flex flex-col gap-4">
        {formError === null ? null : <InlineAlert variant="error">{formError}</InlineAlert>}
        {/* A column: the button takes the full width of a phone and its own width on the desktop. */}
        <div className="flex flex-col lg:items-start">
          <Button type="submit" loading={isSubmitting}>
            {COURIER_VEHICLE_TEXTS.SUBMIT}
          </Button>
        </div>
      </div>
    </form>
  );
}
