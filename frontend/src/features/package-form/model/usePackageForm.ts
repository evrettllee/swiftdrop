import type { PackageParams } from '@/shared/api';
import { useForm } from '@/shared/lib/forms';
import { PACKAGE_DEFAULTS, PACKAGE_FIELD } from '../config/package';
import { packageFormSchema } from './package-form';
import type { PackageFormValues } from './package-values';

// The package form is never submitted: the estimate follows its values, so `onSubmit` does nothing.
// `initial` fills the form on the first render; without it the form starts with the defaults.
export function usePackageForm(initial?: PackageFormValues) {
  const { values, field, checkbox } = useForm({
    initialValues: initial ?? PACKAGE_DEFAULTS,
    schema: packageFormSchema,
    onSubmit: () => Promise.resolve(),
  });

  const parsed = packageFormSchema.safeParse(values);
  // `null` while any field is empty or wrong.
  const params: PackageParams | null = parsed.success ? parsed.data : null;

  const typed: PackageFormValues = {
    [PACKAGE_FIELD.WEIGHT]: values[PACKAGE_FIELD.WEIGHT] ?? '',
    [PACKAGE_FIELD.LENGTH]: values[PACKAGE_FIELD.LENGTH] ?? '',
    [PACKAGE_FIELD.WIDTH]: values[PACKAGE_FIELD.WIDTH] ?? '',
    [PACKAGE_FIELD.HEIGHT]: values[PACKAGE_FIELD.HEIGHT] ?? '',
    [PACKAGE_FIELD.FRAGILE]: values[PACKAGE_FIELD.FRAGILE] ?? '',
  };

  return { field, checkbox, params, values: typed };
}

export type PackageForm = ReturnType<typeof usePackageForm>;
