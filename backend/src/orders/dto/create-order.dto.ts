import { z } from 'zod';
import { geoPointSchema } from '../../common/schemas/geo-point.schema';
import { packageSpecSchema } from '../../common/schemas/package-spec.schema';
import { buildNameSchema, phoneSchema } from '../../common/schemas/person-fields.schema';
import {
  APARTMENT_MAX_LENGTH,
  CITY_MAX_LENGTH,
  HOUSE_MAX_LENGTH,
  ORDERS_VALIDATION_MESSAGES,
  STREET_MAX_LENGTH,
} from '../orders.constants';

const buildRequiredTextSchema = (
  maxLength: number,
  requiredMessage: string,
  tooLongMessage: string,
) => z.string().trim().min(1, requiredMessage).max(maxLength, tooLongMessage);

// The apartment is optional: an empty text is the same as no apartment.
const apartmentSchema = z
  .string()
  .trim()
  .max(APARTMENT_MAX_LENGTH, ORDERS_VALIDATION_MESSAGES.APARTMENT_TOO_LONG)
  .transform((value) => value || undefined)
  .optional();

const orderAddressSchema = geoPointSchema.extend({
  city: buildRequiredTextSchema(
    CITY_MAX_LENGTH,
    ORDERS_VALIDATION_MESSAGES.CITY_REQUIRED,
    ORDERS_VALIDATION_MESSAGES.CITY_TOO_LONG,
  ),
  street: buildRequiredTextSchema(
    STREET_MAX_LENGTH,
    ORDERS_VALIDATION_MESSAGES.STREET_REQUIRED,
    ORDERS_VALIDATION_MESSAGES.STREET_TOO_LONG,
  ),
  house: buildRequiredTextSchema(
    HOUSE_MAX_LENGTH,
    ORDERS_VALIDATION_MESSAGES.HOUSE_REQUIRED,
    ORDERS_VALIDATION_MESSAGES.HOUSE_TOO_LONG,
  ),
  apartment: apartmentSchema,
});

// The price is not part of the request: the server calculates it from the route and the package.
export const createOrderSchema = z.object({
  pickup: orderAddressSchema,
  delivery: orderAddressSchema,
  recipient: z.object({
    name: buildNameSchema(
      ORDERS_VALIDATION_MESSAGES.RECIPIENT_NAME_TOO_SHORT,
      ORDERS_VALIDATION_MESSAGES.RECIPIENT_NAME_TOO_LONG,
      ORDERS_VALIDATION_MESSAGES.RECIPIENT_NAME_INVALID,
    ),
    phone: phoneSchema,
  }),
  package: packageSpecSchema,
});

export type CreateOrderDto = z.infer<typeof createOrderSchema>;
