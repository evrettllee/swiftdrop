import { z } from 'zod';
import { PERSON_FIELD_LENGTH } from '@/common/constants/field-lengths.constants';
import {
  NAME_MIN_LENGTH,
  NAME_PATTERN,
  PHONE_INVALID_MESSAGE,
  PHONE_REGEX,
  PHONE_SEPARATOR_REPLACEMENT,
  PHONE_SEPARATORS_REGEX,
} from '@/common/constants/person-validation.constants';

// The pattern is checked only after the length passes, so each field gets a single message.
export const buildNameSchema = (
  tooShortMessage: string,
  tooLongMessage: string,
  invalidMessage: string,
): z.ZodPipe<z.ZodString, z.ZodString> =>
  z
    .string()
    .trim()
    .min(NAME_MIN_LENGTH, tooShortMessage)
    .max(PERSON_FIELD_LENGTH.NAME, tooLongMessage)
    .pipe(z.string().regex(NAME_PATTERN, invalidMessage));

export const phoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(PHONE_SEPARATORS_REGEX, PHONE_SEPARATOR_REPLACEMENT))
  .pipe(z.string().regex(PHONE_REGEX, PHONE_INVALID_MESSAGE));
