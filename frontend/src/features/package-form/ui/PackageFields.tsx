import { PACKAGE_VALUE_MAX_LENGTH } from '@/shared/config';
import { Checkbox } from '@/shared/ui/checkbox';
import { Input } from '@/shared/ui/input';
import { PACKAGE_DIMENSIONS, PACKAGE_FIELD } from '../config/package';
import { PACKAGE_TEXTS } from '../config/texts';
import type { PackageForm } from '../model/usePackageForm';

// `stacked`: the weight above the three sizes (the calculator of the landing).
// `row`: on the desktop the weight and the sizes in one row of four (the order form).
type PackageFieldsLayout = 'stacked' | 'row';

const GRID_CLASSES: Record<PackageFieldsLayout, string> = {
  stacked: 'grid grid-cols-3 gap-3',
  row: 'grid grid-cols-3 gap-4 lg:grid-cols-4 lg:gap-6',
};

const WEIGHT_CLASSES: Record<PackageFieldsLayout, string> = {
  stacked: 'col-span-3 mb-1',
  row: 'col-span-3 lg:col-span-1',
};

type PackageFieldsProps = {
  form: PackageForm;
  layout?: PackageFieldsLayout;
};

function Unit({ children }: { children: string }) {
  return <span className="pe-3 text-small text-fg-secondary">{children}</span>;
}

export function PackageFields({ form, layout = 'stacked' }: PackageFieldsProps) {
  const { field, checkbox } = form;

  return (
    <div className="flex flex-col gap-4">
      <div className={GRID_CLASSES[layout]}>
        <div className={WEIGHT_CLASSES[layout]}>
          <Input
            label={PACKAGE_TEXTS.WEIGHT}
            inputMode="decimal"
            maxLength={PACKAGE_VALUE_MAX_LENGTH}
            autoComplete="off"
            endAdornment={<Unit>{PACKAGE_TEXTS.UNIT_KG}</Unit>}
            {...field(PACKAGE_FIELD.WEIGHT)}
          />
        </div>
        {PACKAGE_DIMENSIONS.map(({ name, label }) => (
          <Input
            key={name}
            label={label}
            inputMode="numeric"
            maxLength={PACKAGE_VALUE_MAX_LENGTH}
            autoComplete="off"
            endAdornment={<Unit>{PACKAGE_TEXTS.UNIT_CM}</Unit>}
            {...field(name)}
          />
        ))}
      </div>
      <Checkbox label={PACKAGE_TEXTS.FRAGILE} {...checkbox(PACKAGE_FIELD.FRAGILE)} />
    </div>
  );
}
