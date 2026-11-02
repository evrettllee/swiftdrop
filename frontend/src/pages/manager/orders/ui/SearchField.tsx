import { MagnifyingGlassIcon, XIcon } from '@phosphor-icons/react';
import { useId } from 'react';
import { COLOR_TRANSITION_CLASS, ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { MANAGER_SEARCH_MAX_LENGTH } from '@/shared/staff-api';
import { MANAGER_ORDERS_TEXTS } from '../config/texts';
import { isSearchUsable } from '../model/orders-view';

type SearchFieldProps = {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
};

export function SearchField({ value, placeholder, onChange }: SearchFieldProps) {
  const hintId = useId();
  const isTooShort = value.trim() !== '' && !isSearchUsable(value);

  return (
    <div className="flex w-full flex-col gap-1 lg:max-w-110 lg:grow">
      <div className="relative">
        <MagnifyingGlassIcon
          size={ICON_SIZE.MEDIUM}
          weight={ICON_WEIGHT}
          aria-hidden="true"
          className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-fg-secondary"
        />
        <input
          type="search"
          aria-label={MANAGER_ORDERS_TEXTS.SEARCH_LABEL}
          aria-describedby={isTooShort ? hintId : undefined}
          value={value}
          maxLength={MANAGER_SEARCH_MAX_LENGTH}
          onChange={(event) => onChange(event.target.value)}
          className={`h-11 w-full rounded-sm border border-border bg-surface ps-10 pe-11 text-body text-fg shadow-sm placeholder:text-fg-muted focus:border-accent [&::-webkit-search-cancel-button]:hidden ${COLOR_TRANSITION_CLASS}`}
          placeholder={placeholder}
        />
        {value === '' ? null : (
          <button
            type="button"
            aria-label={MANAGER_ORDERS_TEXTS.SEARCH_CLEAR}
            onClick={() => onChange('')}
            className="absolute inset-y-0 end-0 grid w-11 place-items-center rounded-sm text-fg-secondary hover:text-fg"
          >
            <XIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />
          </button>
        )}
      </div>
      {isTooShort ? (
        <p id={hintId} className="text-caption text-fg-secondary">
          {MANAGER_ORDERS_TEXTS.SEARCH_TOO_SHORT}
        </p>
      ) : null}
    </div>
  );
}
