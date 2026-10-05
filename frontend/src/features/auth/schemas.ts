import { z } from 'zod';
import { CHECKBOX_CHECKED_VALUE } from '../../shared/constants';
import {
  EMAIL_MAX_LENGTH,
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_RULES,
  PHONE_REGEX,
  PHONE_SEPARATOR_REPLACEMENT,
  PHONE_SEPARATORS_REGEX,
  ROLE_VALUES,
  VALIDATION_MESSAGES,
} from './constants';

// Responses of the backend

export const authUserSchema = z.object({
  userId: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  role: z.enum(ROLE_VALUES),
});

// Login, registration and refresh answer with { user }; /me answers with the user itself.
export const authResponseSchema = z.object({ user: authUserSchema });

// Forms: the same rules as on the backend, so mistakes are shown before the request is sent.

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, VALIDATION_MESSAGES.EMAIL_REQUIRED)
  .max(EMAIL_MAX_LENGTH, VALIDATION_MESSAGES.EMAIL_TOO_LONG)
  .pipe(z.email(VALIDATION_MESSAGES.EMAIL_INVALID));

const buildNameSchema = (required: string, tooShort: string, tooLong: string) =>
  z.string().trim().min(1, required).min(NAME_MIN_LENGTH, tooShort).max(NAME_MAX_LENGTH, tooLong);

const phoneSchema = z
  .string()
  .trim()
  .min(1, VALIDATION_MESSAGES.PHONE_REQUIRED)
  .transform((value) => value.replace(PHONE_SEPARATORS_REGEX, PHONE_SEPARATOR_REPLACEMENT))
  .pipe(z.string().regex(PHONE_REGEX, VALIDATION_MESSAGES.PHONE_INVALID));

// One message for every unmet rule: the checklist under the field says which one.
const newPasswordSchema = z
  .string()
  .min(1, VALIDATION_MESSAGES.PASSWORD_REQUIRED)
  .max(PASSWORD_MAX_LENGTH, VALIDATION_MESSAGES.PASSWORD_TOO_LONG)
  .refine(
    (value) => PASSWORD_RULES.every((rule) => rule.isMet(value)),
    VALIDATION_MESSAGES.PASSWORD_WEAK,
  );

export const loginFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, VALIDATION_MESSAGES.PASSWORD_REQUIRED),
});

// The consent and the password repeat are checked on the client only; neither is sent to the backend.
export const registerFormSchema = z
  .object({
    firstName: buildNameSchema(
      VALIDATION_MESSAGES.FIRST_NAME_REQUIRED,
      VALIDATION_MESSAGES.FIRST_NAME_TOO_SHORT,
      VALIDATION_MESSAGES.FIRST_NAME_TOO_LONG,
    ),
    lastName: buildNameSchema(
      VALIDATION_MESSAGES.LAST_NAME_REQUIRED,
      VALIDATION_MESSAGES.LAST_NAME_TOO_SHORT,
      VALIDATION_MESSAGES.LAST_NAME_TOO_LONG,
    ),
    email: emailSchema,
    phone: phoneSchema,
    password: newPasswordSchema,
    confirmPassword: z.string().min(1, VALIDATION_MESSAGES.CONFIRM_PASSWORD_REQUIRED),
    terms: z.literal(CHECKBOX_CHECKED_VALUE, { error: VALIDATION_MESSAGES.TERMS_REQUIRED }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    error: VALIDATION_MESSAGES.PASSWORDS_MISMATCH,
    // Zod skips object-level checks while any field is invalid; the repeat is compared anyway.
    when: () => true,
  });
