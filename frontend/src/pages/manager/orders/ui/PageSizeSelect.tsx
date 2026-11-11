import { Select, SELECT_LABEL } from '@/shared/ui/select';
import { PAGE_SIZES, type PageSize } from '../config/list';
import { MANAGER_ORDERS_TEXTS } from '../config/texts';

const PAGE_SIZE_OPTIONS = PAGE_SIZES.map((size) => ({ value: String(size), label: String(size) }));

type PageSizeSelectProps = {
  value: PageSize;
  onChange: (size: PageSize) => void;
};

export function PageSizeSelect({ value, onChange }: PageSizeSelectProps) {
  return (
    <Select
      label={MANAGER_ORDERS_TEXTS.PAGE_SIZE}
      labelMode={SELECT_LABEL.INLINE}
      options={PAGE_SIZE_OPTIONS}
      value={String(value)}
      onChange={(next) => {
        const size = PAGE_SIZES.find((item) => String(item) === next);

        if (size !== undefined) {
          onChange(size);
        }
      }}
      selectClassName="h-9 w-auto field-sizing-content text-small"
    />
  );
}
