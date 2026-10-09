import type { PackageParams } from '@/shared/api';
import { useForm } from '@/shared/lib/forms';
import { PACKAGE_DEFAULTS } from '../config/package';
import { packageFormSchema } from './package-form';

// The package form is never submitted: the estimate follows its values, so `onSubmit` does nothing.
export function usePackageForm() {
  const { values, field, checkbox } = useForm({
    initialValues: PACKAGE_DEFAULTS,
    schema: packageFormSchema,
    onSubmit: () => Promise.resolve(),
  });

  const parsed = packageFormSchema.safeParse(values);
  // `null` while any field is empty or wrong.
  const params: PackageParams | null = parsed.success ? parsed.data : null;

  return { field, checkbox, params };
}

export type PackageForm = ReturnType<typeof usePackageForm>;
