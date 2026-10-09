import type { PackageParams } from '@/shared/api';
import { CHECKBOX_CHECKED_VALUE, CHECKBOX_UNCHECKED_VALUE } from '@/shared/config';
import { DECIMAL_COMMA, DECIMAL_POINT, PACKAGE_FIELD } from '../config/package';

// The typed values of the form, before parsing: a draft of the order keeps them as they are.
export type PackageFormValues = Record<keyof PackageParams, string>;

// A package of an order as the form shows it: "2,5" for the weight (as a user types it), whole
// sizes, the checkbox as its form value.
export function toPackageFormValues(params: PackageParams): PackageFormValues {
  return {
    [PACKAGE_FIELD.WEIGHT]: String(params.weightKg).replace(DECIMAL_POINT, DECIMAL_COMMA),
    [PACKAGE_FIELD.LENGTH]: String(params.lengthCm),
    [PACKAGE_FIELD.WIDTH]: String(params.widthCm),
    [PACKAGE_FIELD.HEIGHT]: String(params.heightCm),
    [PACKAGE_FIELD.FRAGILE]: params.isFragile ? CHECKBOX_CHECKED_VALUE : CHECKBOX_UNCHECKED_VALUE,
  };
}
