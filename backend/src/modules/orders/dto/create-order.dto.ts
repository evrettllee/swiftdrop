import { z } from 'zod';
import { geoPointSchema } from '../../../common/schemas/geo-point.schema';
import { packageSpecSchema } from '../../../common/schemas/package-spec.schema';
import { buildNameSchema, phoneSchema } from '../../../common/schemas/person-fields.schema';
import { ADDRESS_FIELD_LENGTH } from '../../../common/constants/field-lengths.constants';
import {
  ORDERS_VALIDATION_MESSAGES,
  REQUIRED_TEXT_MIN_LENGTH,
} from '../constants/orders.constants';

const buildRequiredTextSchema = (
  maxLength: number,
  requiredMessage: string,
  tooLongMessage: string,
) =>
  z.string().trim().min(REQUIRED_TEXT_MIN_LENGTH, requiredMessage).max(maxLength, tooLongMessage);

// The apartment is optional: an empty text is the same as no apartment.
const apartmentSchema = z
  .string()
  .trim()
  .max(ADDRESS_FIELD_LENGTH.APARTMENT, ORDERS_VALIDATION_MESSAGES.APARTMENT_TOO_LONG)
  .transform((value) => value || undefined)
  .optional();

const orderAddressSchema = geoPointSchema.extend({
  city: buildRequiredTextSchema(
    ADDRESS_FIELD_LENGTH.CITY,
    ORDERS_VALIDATION_MESSAGES.CITY_REQUIRED,
    ORDERS_VALIDATION_MESSAGES.CITY_TOO_LONG,
  ),
  street: buildRequiredTextSchema(
    ADDRESS_FIELD_LENGTH.STREET,
    ORDERS_VALIDATION_MESSAGES.STREET_REQUIRED,
    ORDERS_VALIDATION_MESSAGES.STREET_TOO_LONG,
  ),
  house: buildRequiredTextSchema(
    ADDRESS_FIELD_LENGTH.HOUSE,
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
