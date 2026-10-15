import { useId } from 'react';
import { PackageFields, type PackageForm } from '@/features/package-form';
import { FieldError } from '@/shared/ui/field-error';
import { Section } from '@/shared/ui/section';
import { CHECKOUT_TEXTS } from '../config/texts';

type CheckoutPackageProps = {
  form: PackageForm;
  error: string | null;
};

export function CheckoutPackage({ form, error }: CheckoutPackageProps) {
  const errorId = useId();

  return (
    <Section title={CHECKOUT_TEXTS.SECTION_PACKAGE}>
      <PackageFields form={form} layout="row" />
      {error === null ? null : <FieldError id={errorId}>{error}</FieldError>}
    </Section>
  );
}
