import { z } from 'zod';
import {
  LATITUDE_MAX,
  LATITUDE_MIN,
  LONGITUDE_MAX,
  LONGITUDE_MIN,
  PRICING_VALIDATION_MESSAGES,
} from '../pricing.constants';

const pointSchema = z.object({
  latitude: z
    .number(PRICING_VALIDATION_MESSAGES.LATITUDE_INVALID)
    .min(LATITUDE_MIN, PRICING_VALIDATION_MESSAGES.LATITUDE_INVALID)
    .max(LATITUDE_MAX, PRICING_VALIDATION_MESSAGES.LATITUDE_INVALID),
  longitude: z
    .number(PRICING_VALIDATION_MESSAGES.LONGITUDE_INVALID)
    .min(LONGITUDE_MIN, PRICING_VALIDATION_MESSAGES.LONGITUDE_INVALID)
    .max(LONGITUDE_MAX, PRICING_VALIDATION_MESSAGES.LONGITUDE_INVALID),
});

const packageValueSchema = z
  .number(PRICING_VALIDATION_MESSAGES.PACKAGE_VALUE_INVALID)
  .positive(PRICING_VALIDATION_MESSAGES.PACKAGE_VALUE_INVALID);

export const estimatePriceSchema = z.object({
  pickup: pointSchema,
  delivery: pointSchema,
  package: z.object({
    weightKg: packageValueSchema,
    lengthCm: packageValueSchema,
    widthCm: packageValueSchema,
    heightCm: packageValueSchema,
    isFragile: z.boolean(PRICING_VALIDATION_MESSAGES.FRAGILE_INVALID).default(false),
  }),
});

export type EstimatePriceDto = z.infer<typeof estimatePriceSchema>;
