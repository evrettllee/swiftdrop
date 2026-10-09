import { useId } from 'react';
import { PackageFields, type PackageForm } from '@/features/package-form';
import { FieldError } from '@/shared/ui/field-error';
import { CHECKOUT_TEXTS } from '../config/texts';

type CheckoutPackageProps = {
  form: PackageForm;
  error: string | null;
};

export function CheckoutPackage({ form, error }: CheckoutPackageProps) {
  const headingId = useId();
  const errorId = useId();

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4">
      <h2 id={headingId} className="text-heading-sm font-semibold text-balance">
        {CHECKOUT_TEXTS.SECTION_PACKAGE}
      </h2>
      <PackageFields form={form} layout="row" />
      {error === null ? null : <FieldError id={errorId}>{error}</FieldError>}
    </section>
  );
}
