import { z } from 'zod';
import { VEHICLE_TYPE } from '@/shared/api';
import {
  LICENSE_PLATE_MIN_LENGTH,
  LICENSE_PLATE_PATTERN,
  VEHICLE_FIELD,
  VEHICLE_FIELD_LENGTH,
  VEHICLE_TEXT_MIN_LENGTH,
  VEHICLES_WITH_REGISTRATION,
} from '../config/vehicle-form';
import { VEHICLE_VALIDATION_MESSAGES as MESSAGES } from '../config/texts';

const brandSchema = z
  .string()
  .trim()
  .min(VEHICLE_TEXT_MIN_LENGTH, MESSAGES.BRAND_REQUIRED)
  .max(VEHICLE_FIELD_LENGTH.BRAND, MESSAGES.brandTooLong(VEHICLE_FIELD_LENGTH.BRAND));

const modelSchema = z
  .string()
  .trim()
  .min(VEHICLE_TEXT_MIN_LENGTH, MESSAGES.MODEL_REQUIRED)
  .max(VEHICLE_FIELD_LENGTH.MODEL, MESSAGES.modelTooLong(VEHICLE_FIELD_LENGTH.MODEL));

// Plates are kept in upper case, so "1234 ab-7" and "1234 AB-7" are the same plate. An empty field
// asks for the plate; anything else that does not fit gets the hint of the right format.
const licensePlateSchema = z
  .string()
  .trim()
  .toUpperCase()
  .min(VEHICLE_TEXT_MIN_LENGTH, MESSAGES.PLATE_REQUIRED)
  .pipe(
    z
      .string()
      .min(LICENSE_PLATE_MIN_LENGTH, MESSAGES.PLATE_INVALID)
      .max(VEHICLE_FIELD_LENGTH.LICENSE_PLATE, MESSAGES.PLATE_INVALID)
      .regex(LICENSE_PLATE_PATTERN, MESSAGES.PLATE_INVALID),
  );

const registrationSchema = z.object({
  [VEHICLE_FIELD.BRAND]: brandSchema,
  [VEHICLE_FIELD.MODEL]: modelSchema,
  [VEHICLE_FIELD.LICENSE_PLATE]: licensePlateSchema,
});

// The vehicle form: the same rules as on the backend (update-vehicle.dto.ts). The brand, the model
// and the plate are checked and sent only for the transport that has them.
export const vehicleFormSchema = z
  .object({
    [VEHICLE_FIELD.TYPE]: z.enum(VEHICLE_TYPE, { error: MESSAGES.TYPE_INVALID }),
    [VEHICLE_FIELD.BRAND]: z.string(),
    [VEHICLE_FIELD.MODEL]: z.string(),
    [VEHICLE_FIELD.LICENSE_PLATE]: z.string(),
  })
  .transform((values, context) => {
    if (!VEHICLES_WITH_REGISTRATION.includes(values.type)) {
      return { type: values.type };
    }

    const registration = registrationSchema.safeParse(values);

    if (!registration.success) {
      for (const issue of registration.error.issues) {
        context.addIssue({ code: 'custom', path: issue.path, message: issue.message });
      }

      return z.NEVER;
    }

    return { type: values.type, ...registration.data };
  });

export type VehicleInput = z.output<typeof vehicleFormSchema>;
