import { z } from 'zod';
import { PACKAGE_VALIDATION_MESSAGES } from '../constants/package.constants';

const packageValueSchema = z
  .number(PACKAGE_VALIDATION_MESSAGES.PACKAGE_VALUE_INVALID)
  .positive(PACKAGE_VALIDATION_MESSAGES.PACKAGE_VALUE_INVALID);

export const packageSpecSchema = z.object({
  weightKg: packageValueSchema,
  lengthCm: packageValueSchema,
  widthCm: packageValueSchema,
  heightCm: packageValueSchema,
  isFragile: z.boolean(PACKAGE_VALIDATION_MESSAGES.FRAGILE_INVALID).default(false),
});

export type PackageSpec = z.infer<typeof packageSpecSchema>;
