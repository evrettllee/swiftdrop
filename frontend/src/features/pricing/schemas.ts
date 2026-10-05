import { z } from 'zod';
import { CHECKBOX_CHECKED_VALUE } from '../../shared/constants';
import {
  DECIMAL_COMMA,
  DECIMAL_PATTERN,
  DECIMAL_POINT,
  PACKAGE_ERRORS,
  PACKAGE_FIELD,
  WHOLE_PATTERN,
} from './constants';

// Response of POST /api/pricing/estimates
export const priceEstimateSchema = z.object({
  price: z.number(),
  currency: z.string(),
  distanceKm: z.number(),
  estimatedMinutes: z.number(),
  // The demand coefficient: 1 means the base price, a higher value is shown to the user as a surcharge.
  coefficient: z.number(),
});

function parseDecimal(text: string): number {
  return Number(text.replace(DECIMAL_COMMA, DECIMAL_POINT));
}

// The weight may have a fraction: both "2.5" and "2,5" are accepted.
const decimalSchema = z
  .string()
  .trim()
  .min(1, PACKAGE_ERRORS.REQUIRED)
  .regex(DECIMAL_PATTERN, PACKAGE_ERRORS.NOT_NUMBER)
  .transform(parseDecimal)
  .pipe(z.number().positive(PACKAGE_ERRORS.NOT_POSITIVE));

const wholeSchema = z
  .string()
  .trim()
  .min(1, PACKAGE_ERRORS.REQUIRED)
  .regex(WHOLE_PATTERN, PACKAGE_ERRORS.NOT_WHOLE)
  .transform(Number)
  .pipe(z.number().positive(PACKAGE_ERRORS.NOT_POSITIVE));

// Values of the package form in the calculator. The size limits of the transport are checked
// by the backend: it answers 422 with a message.
export const packageFormSchema = z.object({
  [PACKAGE_FIELD.WEIGHT]: decimalSchema,
  [PACKAGE_FIELD.LENGTH]: wholeSchema,
  [PACKAGE_FIELD.WIDTH]: wholeSchema,
  [PACKAGE_FIELD.HEIGHT]: wholeSchema,
  [PACKAGE_FIELD.FRAGILE]: z.string().transform((value) => value === CHECKBOX_CHECKED_VALUE),
});
