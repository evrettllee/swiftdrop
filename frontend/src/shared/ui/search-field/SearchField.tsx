import { MagnifyingGlassIcon, XIcon } from '@phosphor-icons/react';
import { useId } from 'react';
import { COLOR_TRANSITION_CLASS, ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { joinClassNames } from '@/shared/lib/class-names';

type SearchFieldProps = {
  value: string;
  label: string;
  placeholder: string;
  clearLabel: string;
  maxLength: number;
  hint?: string | null;
  className?: string;
  onChange: (value: string) => void;
};

export function SearchField({
  value,
  label,
  placeholder,
  clearLabel,
  maxLength,
  hint = null,
  className = '',
  onChange,
}: SearchFieldProps) {
  const hintId = useId();

  return (
    <div className={joinClassNames('flex w-full flex-col gap-1', className)}>
      <div className="relative">
        <MagnifyingGlassIcon
          size={ICON_SIZE.MEDIUM}
          weight={ICON_WEIGHT}
          aria-hidden="true"
          className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-fg-secondary"
        />
        <input
          type="search"
          aria-label={label}
          aria-describedby={hint === null ? undefined : hintId}
          value={value}
          maxLength={maxLength}
          onChange={(event) => onChange(event.target.value)}
          className={`h-11 w-full rounded-sm border border-border bg-surface ps-10 pe-11 text-body text-fg shadow-sm placeholder:text-fg-muted focus:border-accent [&::-webkit-search-cancel-button]:hidden ${COLOR_TRANSITION_CLASS}`}
          placeholder={placeholder}
        />
        {value === '' ? null : (
          <button
            type="button"
            aria-label={clearLabel}
            onClick={() => onChange('')}
            className="absolute inset-y-0 end-0 grid w-11 place-items-center rounded-sm text-fg-secondary hover:text-fg"
          >
            <XIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />
          </button>
        )}
      </div>
      {hint === null ? null : (
        <p id={hintId} className="text-caption text-fg-secondary">
          {hint}
        </p>
      )}
    </div>
  );
}
