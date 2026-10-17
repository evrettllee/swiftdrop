import { type FormEvent, useRef } from 'react';
import { useNavigate } from 'react-router';
import { setCourierVehicle } from '@/entities/courier';
import type { CourierVehicle } from '@/shared/api';
import { useForm } from '@/shared/lib/forms';
import { APP_ROUTES } from '@/shared/routes';
import { updateVehicle } from '../api/update-vehicle';
import { VEHICLE_FIELD } from '../config/vehicle-form';
import { type VehicleInput, vehicleFormSchema } from './vehicle-form';

function buildInitialValues(vehicle: CourierVehicle | null) {
  return {
    [VEHICLE_FIELD.TYPE]: vehicle?.type ?? '',
    [VEHICLE_FIELD.BRAND]: vehicle?.brand ?? '',
    [VEHICLE_FIELD.MODEL]: vehicle?.model ?? '',
    [VEHICLE_FIELD.LICENSE_PLATE]: vehicle?.licensePlate ?? '',
  };
}

// The vehicle form filled with the current vehicle. A saved vehicle goes to the profile of the
// cabinet and the courier returns to the work page.
export function useVehicleForm(vehicle: CourierVehicle | null) {
  const navigate = useNavigate();
  // Set at once when the vehicle starts being saved and kept after it is saved: a second press (a
  // double click or Enter) is ignored before any render could mark the button busy. Cleared only
  // when the vehicle was not saved, so the courier may send the form again.
  const isSaving = useRef(false);

  async function save(input: VehicleInput): Promise<void> {
    isSaving.current = true;

    try {
      setCourierVehicle(await updateVehicle(input));
    } catch (error) {
      isSaving.current = false;
      throw error;
    }

    void navigate(APP_ROUTES.COURIER_WORK);
  }

  const form = useForm({
    initialValues: buildInitialValues(vehicle),
    schema: vehicleFormSchema,
    onSubmit: save,
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    if (isSaving.current) {
      event.preventDefault();
      return;
    }

    form.handleSubmit(event);
  }

  return { ...form, handleSubmit };
}
