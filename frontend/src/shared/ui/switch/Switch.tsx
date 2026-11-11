import { CheckIcon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { COLOR_TRANSITION_CLASS, ICON_WEIGHT } from '@/shared/config';
import { joinClassNames } from '@/shared/lib/class-names';

const KNOB_ICON_SIZE = 14;

type SwitchProps = {
  isOn: boolean;
  label?: string;
  describedBy?: string;
  disabled?: boolean;
  className?: string;
  onChange: (isOn: boolean) => void;
  children?: ReactNode;
};

export function Switch({
  isOn,
  label,
  describedBy,
  disabled = false,
  className = '',
  onChange,
  children,
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOn}
      aria-label={label}
      aria-describedby={describedBy}
      disabled={disabled}
      onClick={() => onChange(!isOn)}
      className={joinClassNames(
        'group inline-flex min-h-11 items-center gap-2 rounded-md text-small disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={joinClassNames(
          'relative block h-6 w-11 shrink-0 rounded-full',
          COLOR_TRANSITION_CLASS,
          isOn ? 'bg-primary' : 'bg-fg-muted',
        )}
      >
        <span
          className={joinClassNames(
            'absolute top-0.5 grid size-5 place-items-center rounded-full bg-surface text-primary shadow-sm transition-[inset-inline-start] duration-150 motion-reduce:transition-none dark:bg-on-primary',
            isOn ? 'start-5.5' : 'start-0.5',
          )}
        >
          {isOn ? <CheckIcon size={KNOB_ICON_SIZE} weight={ICON_WEIGHT} /> : null}
        </span>
      </span>
      {children}
    </button>
  );
}
