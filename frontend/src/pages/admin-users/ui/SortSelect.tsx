import { CaretDownIcon } from '@phosphor-icons/react';
import { useId } from 'react';
import { ADMIN_USER_SORTS, type AdminUserSort } from '../config/admin-user';
import { COLOR_TRANSITION_CLASS, ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { Select, SELECT_LABEL } from '@/shared/ui/select';
import { ADMIN_USERS_TEXTS as TEXTS } from '../config/texts';

const SORT_LABELS: Record<AdminUserSort, string> = {
  newest: TEXTS.SORT_NEWEST,
  oldest: TEXTS.SORT_OLDEST,
  name: TEXTS.SORT_NAME,
};

const SHORT_SORT_LABELS: Record<AdminUserSort, string> = {
  newest: TEXTS.SORT_NEWEST_SHORT,
  oldest: TEXTS.SORT_OLDEST_SHORT,
  name: TEXTS.SORT_NAME,
};

type SortSelectProps = {
  isDesktop: boolean;
  value: AdminUserSort;
  onChange: (sort: AdminUserSort) => void;
};

function isSort(value: string): value is AdminUserSort {
  return ADMIN_USER_SORTS.some((sort) => sort === value);
}

export function SortSelect({ isDesktop, value, onChange }: SortSelectProps) {
  const id = useId();

  if (!isDesktop) {
    return (
      <Select<AdminUserSort>
        label={TEXTS.SORT}
        labelMode={SELECT_LABEL.HIDDEN}
        options={ADMIN_USER_SORTS.map((sort) => ({
          value: sort,
          label: SHORT_SORT_LABELS[sort],
          fullLabel: SORT_LABELS[sort],
        }))}
        value={value}
        onChange={onChange}
        className="min-w-0 grow basis-0"
      />
    );
  }

  return (
    <div
      className={`relative ms-auto flex h-11 items-center rounded-sm border border-border bg-surface shadow-sm focus-within:border-accent hover:bg-surface-muted ${COLOR_TRANSITION_CLASS}`}
    >
      <label htmlFor={id} className="ps-3 text-body whitespace-nowrap text-fg-secondary">
        {TEXTS.SORT}:
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => {
          if (isSort(event.target.value)) {
            onChange(event.target.value);
          }
        }}
        className="h-full cursor-pointer appearance-none bg-transparent ps-2 pe-10 text-body text-fg outline-none field-sizing-content"
      >
        {ADMIN_USER_SORTS.map((sort) => (
          <option key={sort} value={sort}>
            {SORT_LABELS[sort]}
          </option>
        ))}
      </select>
      <CaretDownIcon
        size={ICON_SIZE.MEDIUM}
        weight={ICON_WEIGHT}
        aria-hidden="true"
        className="pointer-events-none absolute end-3 text-fg-secondary"
      />
    </div>
  );
}
