import { z } from 'zod';
import { VEHICLE_FIELD_LENGTH } from '../../../common/constants/field-lengths.constants';
import { VEHICLE_TYPE_VALUES } from '../../../common/enums/vehicle-type.enum';
import {
  COURIERS_VALIDATION_MESSAGES as MESSAGES,
  LICENSE_PLATE_MIN_LENGTH,
  LICENSE_PLATE_PATTERN,
  VEHICLE_TEXT_MIN_LENGTH,
  VEHICLES_WITH_REGISTRATION,
} from '../constants/couriers.constants';

const brandSchema = z
  .string(MESSAGES.BRAND_REQUIRED)
  .trim()
  .min(VEHICLE_TEXT_MIN_LENGTH, MESSAGES.BRAND_REQUIRED)
  .max(VEHICLE_FIELD_LENGTH.BRAND, MESSAGES.BRAND_TOO_LONG);

const modelSchema = z
  .string(MESSAGES.MODEL_REQUIRED)
  .trim()
  .min(VEHICLE_TEXT_MIN_LENGTH, MESSAGES.MODEL_REQUIRED)
  .max(VEHICLE_FIELD_LENGTH.MODEL, MESSAGES.MODEL_TOO_LONG);

// Plates are kept in upper case, so "1234 ab-7" and "1234 AB-7" are the same plate.
const licensePlateSchema = z
  .string(MESSAGES.PLATE_REQUIRED)
  .trim()
  .toUpperCase()
  .min(LICENSE_PLATE_MIN_LENGTH, MESSAGES.PLATE_INVALID)
  .max(VEHICLE_FIELD_LENGTH.LICENSE_PLATE, MESSAGES.PLATE_INVALID)
  .regex(LICENSE_PLATE_PATTERN, MESSAGES.PLATE_INVALID);

const REGISTRATION_FIELDS = [
  ['brand', MESSAGES.BRAND_REQUIRED],
  ['model', MESSAGES.MODEL_REQUIRED],
  ['licensePlate', MESSAGES.PLATE_REQUIRED],
] as const;

export const updateVehicleSchema = z
  .object({
    type: z.enum(VEHICLE_TYPE_VALUES, { error: MESSAGES.TYPE_INVALID }),
    brand: brandSchema.optional(),
    model: modelSchema.optional(),
    licensePlate: licensePlateSchema.optional(),
  })
  .superRefine((value, context) => {
    if (VEHICLES_WITH_REGISTRATION.includes(value.type)) {
      for (const [field, message] of REGISTRATION_FIELDS) {
        if (value[field] === undefined) {
          context.addIssue({ code: 'custom', path: [field], message });
        }
      }
    }
  })
  // A vehicle without registration keeps no brand, model or plate, even if the form sent them.
  .transform((value) => {
    const hasRegistration = VEHICLES_WITH_REGISTRATION.includes(value.type);

    return {
      type: value.type,
      brand: hasRegistration ? (value.brand ?? null) : null,
      model: hasRegistration ? (value.model ?? null) : null,
      licensePlate: hasRegistration ? (value.licensePlate ?? null) : null,
    };
  });

export type UpdateVehicleDto = z.infer<typeof updateVehicleSchema>;
