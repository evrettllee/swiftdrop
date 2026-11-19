import { z } from 'zod';
import { newPasswordSchema, PASSWORD_MESSAGES } from '@/features/password-fields';
import { CHECKBOX_CHECKED_VALUE } from '@/shared/config';
import {
  buildEmailSchema,
  buildNameSchema,
  buildPhoneSchema,
} from '@/shared/lib/person-validation';
import { AUTH_FIELD } from '../config/forms';
import { VALIDATION_MESSAGES } from '../config/validation';

// Forms: the same rules as on the backend, so mistakes are shown before the request is sent.

const emailSchema = buildEmailSchema(
  VALIDATION_MESSAGES.EMAIL_REQUIRED,
  VALIDATION_MESSAGES.EMAIL_INVALID,
  VALIDATION_MESSAGES.EMAIL_TOO_LONG,
);

export const loginFormSchema = z.object({
  [AUTH_FIELD.EMAIL]: emailSchema,
  [AUTH_FIELD.PASSWORD]: z.string().min(1, VALIDATION_MESSAGES.PASSWORD_REQUIRED),
});

// The consent and the password repeat are checked on the client only; neither is sent to the backend.
export const registerFormSchema = z
  .object({
    [AUTH_FIELD.FIRST_NAME]: buildNameSchema(
      VALIDATION_MESSAGES.FIRST_NAME_REQUIRED,
      VALIDATION_MESSAGES.FIRST_NAME_TOO_SHORT,
      VALIDATION_MESSAGES.FIRST_NAME_TOO_LONG,
      VALIDATION_MESSAGES.FIRST_NAME_INVALID,
    ),
    [AUTH_FIELD.LAST_NAME]: buildNameSchema(
      VALIDATION_MESSAGES.LAST_NAME_REQUIRED,
      VALIDATION_MESSAGES.LAST_NAME_TOO_SHORT,
      VALIDATION_MESSAGES.LAST_NAME_TOO_LONG,
      VALIDATION_MESSAGES.LAST_NAME_INVALID,
    ),
    [AUTH_FIELD.EMAIL]: emailSchema,
    [AUTH_FIELD.PHONE]: buildPhoneSchema(
      VALIDATION_MESSAGES.PHONE_REQUIRED,
      VALIDATION_MESSAGES.PHONE_INVALID,
    ),
    [AUTH_FIELD.PASSWORD]: newPasswordSchema,
    [AUTH_FIELD.CONFIRM_PASSWORD]: z.string().min(1, PASSWORD_MESSAGES.CONFIRM_REQUIRED),
    [AUTH_FIELD.TERMS]: z.literal(CHECKBOX_CHECKED_VALUE, {
      error: VALIDATION_MESSAGES.TERMS_REQUIRED,
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: [AUTH_FIELD.CONFIRM_PASSWORD],
    error: PASSWORD_MESSAGES.MISMATCH,
    // Zod skips object-level checks while any field is invalid; the repeat is compared anyway.
    when: () => true,
  });
