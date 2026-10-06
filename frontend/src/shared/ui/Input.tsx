import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { COLOR_TRANSITION_CLASS, ID_PART } from '../constants';
import { FieldError } from './FieldError';

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  label: string;
  error?: string;
  hint?: string;
  endAdornment?: ReactNode;
  // A list under the field (suggestions): it is placed relative to the field, not to the label.
  popup?: ReactNode;
};

function getFieldClassName(hasError: boolean, hasAdornment: boolean): string {
  return [
    'h-11 w-full rounded-sm border bg-surface px-3 text-body text-fg shadow-sm placeholder:text-fg-muted',
    COLOR_TRANSITION_CLASS,
    'disabled:bg-field disabled:text-fg-muted disabled:shadow-none',
    hasError ? 'border-danger' : 'border-border focus:border-accent',
    hasAdornment ? 'pe-11' : '',
  ]
    .filter(Boolean)
    .join(' ');
}

export function Input({ label, error, hint, endAdornment, popup, ...inputProps }: InputProps) {
  const id = useId();
  const hintId = `${id}-${ID_PART.HINT}`;
  const errorId = `${id}-${ID_PART.ERROR}`;
  const hasError = error !== undefined;
  const showHint = !hasError && hint !== undefined;
  let describedBy: string | undefined;

  if (hasError) {
    describedBy = errorId;
  } else if (showHint) {
    describedBy = hintId;
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-small font-semibold">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          aria-invalid={hasError}
          aria-describedby={describedBy}
          className={getFieldClassName(hasError, endAdornment !== undefined)}
          {...inputProps}
        />
        {endAdornment === undefined ? null : (
          <div className="absolute inset-y-0 end-0 flex items-center">{endAdornment}</div>
        )}
        {popup}
      </div>
      {hasError ? <FieldError id={errorId}>{error}</FieldError> : null}
      {showHint ? (
        <p id={hintId} className="text-small text-fg-secondary">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
