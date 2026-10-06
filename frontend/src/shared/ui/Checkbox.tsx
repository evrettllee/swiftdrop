import { CheckIcon } from '@phosphor-icons/react';
import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { ID_PART } from '../constants/dom';
import { ICON_SIZE, ICON_WEIGHT } from '../constants/styles';
import { FieldError } from './FieldError';

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type'> & {
  label: ReactNode;
  error?: string;
};

// The native input stays in the page for keyboards and screen readers; the box is drawn next to it.
export function Checkbox({ label, error, ...inputProps }: CheckboxProps) {
  const id = useId();
  const errorId = `${id}-${ID_PART.ERROR}`;
  const hasError = error !== undefined;
  const boxClassName = [
    'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-sm border bg-surface text-on-primary',
    '[&>svg]:hidden peer-checked:[&>svg]:block peer-checked:border-primary peer-checked:bg-primary',
    'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent',
    'peer-disabled:border-border peer-disabled:bg-field',
    hasError ? 'border-danger' : 'border-fg-muted',
  ].join(' ');

  return (
    <div className="flex flex-col gap-2">
      <label className="flex cursor-pointer items-start gap-3 text-body">
        <input
          id={id}
          type="checkbox"
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : undefined}
          className="peer sr-only"
          {...inputProps}
        />
        <span aria-hidden="true" className={boxClassName}>
          <CheckIcon size={ICON_SIZE.SMALL} weight={ICON_WEIGHT} />
        </span>
        <span>{label}</span>
      </label>
      {hasError ? <FieldError id={errorId}>{error}</FieldError> : null}
    </div>
  );
}
