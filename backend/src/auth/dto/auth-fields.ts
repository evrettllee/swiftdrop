import { z } from 'zod';
import {
  AUTH_VALIDATION_MESSAGES,
  EMAIL_MAX_LENGTH,
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
  NAME_PATTERN,
  PASSWORD_DIGIT_REGEX,
  PASSWORD_LOWERCASE_REGEX,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_SPECIAL_REGEX,
  PASSWORD_UPPERCASE_REGEX,
  PHONE_REGEX,
  PHONE_SEPARATOR_REPLACEMENT,
  PHONE_SEPARATORS_REGEX,
} from '../constants/validation';

// The pattern is checked only after the length passes, so each field gets a single message.
export const buildNameSchema = (
  tooShortMessage: string,
  tooLongMessage: string,
  invalidMessage: string,
) =>
  z
    .string()
    .trim()
    .min(NAME_MIN_LENGTH, tooShortMessage)
    .max(NAME_MAX_LENGTH, tooLongMessage)
    .pipe(z.string().regex(NAME_PATTERN, invalidMessage));

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(EMAIL_MAX_LENGTH, AUTH_VALIDATION_MESSAGES.EMAIL_TOO_LONG)
  .pipe(z.email(AUTH_VALIDATION_MESSAGES.EMAIL_INVALID));

export const phoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(PHONE_SEPARATORS_REGEX, PHONE_SEPARATOR_REPLACEMENT))
  .pipe(z.string().regex(PHONE_REGEX, AUTH_VALIDATION_MESSAGES.PHONE_INVALID));

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, AUTH_VALIDATION_MESSAGES.PASSWORD_TOO_SHORT)
  .max(PASSWORD_MAX_LENGTH, AUTH_VALIDATION_MESSAGES.PASSWORD_TOO_LONG)
  .regex(PASSWORD_UPPERCASE_REGEX, AUTH_VALIDATION_MESSAGES.PASSWORD_NO_UPPERCASE)
  .regex(PASSWORD_LOWERCASE_REGEX, AUTH_VALIDATION_MESSAGES.PASSWORD_NO_LOWERCASE)
  .regex(PASSWORD_DIGIT_REGEX, AUTH_VALIDATION_MESSAGES.PASSWORD_NO_DIGIT)
  .regex(PASSWORD_SPECIAL_REGEX, AUTH_VALIDATION_MESSAGES.PASSWORD_NO_SPECIAL);
