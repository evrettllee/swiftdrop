import { z } from 'zod';
import { APARTMENT_MAX_LENGTH } from '@/shared/config';
import { buildNameSchema, buildPhoneSchema } from '@/shared/lib/person-validation';
import { CHECKOUT_FIELD } from '../config/checkout-form';
import { CHECKOUT_VALIDATION_MESSAGES } from '../config/texts';

const apartmentSchema = z
  .string()
  .trim()
  .max(APARTMENT_MAX_LENGTH, CHECKOUT_VALIDATION_MESSAGES.APARTMENT_TOO_LONG);

// The recipient and the apartments of the order form: the same rules as on the backend. The route
// and the package are checked apart, they come from the map and from the package form.
export const checkoutFormSchema = z.object({
  [CHECKOUT_FIELD.RECIPIENT_NAME]: buildNameSchema(
    CHECKOUT_VALIDATION_MESSAGES.RECIPIENT_NAME_REQUIRED,
    CHECKOUT_VALIDATION_MESSAGES.RECIPIENT_NAME_TOO_SHORT,
    CHECKOUT_VALIDATION_MESSAGES.RECIPIENT_NAME_TOO_LONG,
    CHECKOUT_VALIDATION_MESSAGES.RECIPIENT_NAME_INVALID,
  ),
  [CHECKOUT_FIELD.RECIPIENT_PHONE]: buildPhoneSchema(
    CHECKOUT_VALIDATION_MESSAGES.RECIPIENT_PHONE_REQUIRED,
    CHECKOUT_VALIDATION_MESSAGES.RECIPIENT_PHONE_INVALID,
  ),
  [CHECKOUT_FIELD.PICKUP_APARTMENT]: apartmentSchema,
  [CHECKOUT_FIELD.DELIVERY_APARTMENT]: apartmentSchema,
});

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;
