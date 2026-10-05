import { Checkbox } from '../../../shared/ui/Checkbox';
import { Input } from '../../../shared/ui/Input';
import { CALCULATOR_TEXTS, PACKAGE_DIMENSIONS, PACKAGE_FIELD } from '../constants';
import type { PackageForm } from '../lib/usePackageForm';

type PackageFieldsProps = {
  form: PackageForm;
};

function Unit({ children }: { children: string }) {
  return <span className="pe-3 text-small text-fg-secondary">{children}</span>;
}

export function PackageFields({ form }: PackageFieldsProps) {
  const { field, checkbox } = form;

  return (
    <div className="flex flex-col gap-4">
      <Input
        label={CALCULATOR_TEXTS.WEIGHT}
        inputMode="decimal"
        autoComplete="off"
        endAdornment={<Unit>{CALCULATOR_TEXTS.UNIT_KG}</Unit>}
        {...field(PACKAGE_FIELD.WEIGHT)}
      />
      <div className="grid grid-cols-3 gap-3">
        {PACKAGE_DIMENSIONS.map(({ name, label }) => (
          <Input
            key={name}
            label={label}
            inputMode="numeric"
            autoComplete="off"
            endAdornment={<Unit>{CALCULATOR_TEXTS.UNIT_CM}</Unit>}
            {...field(name)}
          />
        ))}
      </div>
      <Checkbox label={CALCULATOR_TEXTS.FRAGILE} {...checkbox(PACKAGE_FIELD.FRAGILE)} />
    </div>
  );
}
