import { CaretDownIcon, type Icon } from '@phosphor-icons/react';
import { useId } from 'react';
import { COLOR_TRANSITION_CLASS, ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { joinClassNames } from '@/shared/lib/class-names';
import { SELECT_LABEL, type SelectLabel } from './select-label';

export type SelectOption<TValue extends string> = {
  value: TValue;
  label: string;
};

const WRAPPER_CLASSES: Record<SelectLabel, string> = {
  above: 'flex flex-col gap-2',
  inline: 'flex items-center gap-2',
  hidden: 'flex',
};

const LABEL_CLASSES: Record<SelectLabel, string> = {
  above: 'text-small font-semibold',
  inline: 'text-small text-fg-secondary whitespace-nowrap',
  hidden: 'sr-only',
};

type SelectProps<TValue extends string> = {
  label: string;
  labelMode?: SelectLabel;
  options: readonly SelectOption<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
  icon?: Icon;
  className?: string;
  fieldClassName?: string;
  selectClassName?: string;
};

export function Select<TValue extends string>({
  label,
  labelMode = SELECT_LABEL.ABOVE,
  options,
  value,
  onChange,
  icon: LeadIcon,
  className = '',
  fieldClassName = '',
  selectClassName = '',
}: SelectProps<TValue>) {
  const id = useId();

  function handleChange(next: string): void {
    const option = options.find((item) => item.value === next);

    if (option !== undefined) {
      onChange(option.value);
    }
  }

  return (
    <div className={joinClassNames(WRAPPER_CLASSES[labelMode], className)}>
      <label htmlFor={id} className={LABEL_CLASSES[labelMode]}>
        {label}
      </label>
      <div className={joinClassNames('relative flex min-w-0 grow', fieldClassName)}>
        {LeadIcon === undefined ? null : (
          <LeadIcon
            size={ICON_SIZE.MEDIUM}
            weight={ICON_WEIGHT}
            aria-hidden="true"
            className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-fg-secondary"
          />
        )}
        <select
          id={id}
          value={value}
          onChange={(event) => handleChange(event.target.value)}
          className={joinClassNames(
            'h-11 w-full min-w-0 cursor-pointer appearance-none rounded-sm border border-border bg-surface pe-10 text-body text-fg shadow-sm hover:bg-surface-muted focus:border-accent',
            COLOR_TRANSITION_CLASS,
            LeadIcon === undefined ? 'ps-3' : 'ps-10',
            selectClassName,
          )}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <CaretDownIcon
          size={ICON_SIZE.MEDIUM}
          weight={ICON_WEIGHT}
          aria-hidden="true"
          className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-fg-secondary"
        />
      </div>
    </div>
  );
}
