import { z } from 'zod';
import {
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
  NAME_PATTERN,
  PHONE_REGEX,
  PHONE_SEPARATOR_REPLACEMENT,
  PHONE_SEPARATORS_REGEX,
} from './person-validation';

// The pattern is checked only after the length passes, so the field shows one clear message.
export const buildNameSchema = (
  required: string,
  tooShort: string,
  tooLong: string,
  invalid: string,
) =>
  z
    .string()
    .trim()
    .min(1, required)
    .min(NAME_MIN_LENGTH, tooShort)
    .max(NAME_MAX_LENGTH, tooLong)
    .pipe(z.string().regex(NAME_PATTERN, invalid));

export const buildPhoneSchema = (required: string, invalid: string) =>
  z
    .string()
    .trim()
    .min(1, required)
    .transform((value) => value.replace(PHONE_SEPARATORS_REGEX, PHONE_SEPARATOR_REPLACEMENT))
    .pipe(z.string().regex(PHONE_REGEX, invalid));
