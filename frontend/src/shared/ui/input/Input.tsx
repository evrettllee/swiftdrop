import { type InputHTMLAttributes, type ReactNode, useId } from 'react';
import { COLOR_TRANSITION_CLASS, ID_PART } from '@/shared/config';
import { joinClassNames } from '@/shared/lib/class-names';
import { FieldError } from '@/shared/ui/field-error';
import { Spinner } from '@/shared/ui/spinner';

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  label: string;
  // A small mark before the label, for example the point of a route.
  labelAdornment?: ReactNode;
  error?: string;
  hint?: string;
  endAdornment?: ReactNode;
  // A field that loads something (an address search): true shows the spinner at its end. Any value,
  // false too, keeps the room for the spinner, so the text does not move when it appears.
  loading?: boolean;
  // A list under the field (suggestions): it is placed relative to the field, not to the label.
  popup?: ReactNode;
};

function getFieldClassName(hasError: boolean, hasAdornment: boolean): string {
  return joinClassNames(
    'h-11 w-full rounded-sm border bg-surface px-3 text-body text-fg shadow-sm placeholder:text-fg-muted',
    COLOR_TRANSITION_CLASS,
    'disabled:bg-field disabled:text-fg-muted disabled:shadow-none',
    hasError ? 'border-danger' : 'border-border focus:border-accent',
    hasAdornment ? 'pe-11' : '',
  );
}

export function Input({
  label,
  labelAdornment,
  error,
  hint,
  endAdornment,
  loading,
  popup,
  ...inputProps
}: InputProps) {
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
      <label htmlFor={id} className="flex items-center gap-2 text-small font-semibold">
        {labelAdornment}
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          aria-invalid={hasError}
          aria-describedby={describedBy}
          className={getFieldClassName(
            hasError,
            endAdornment !== undefined || loading !== undefined,
          )}
          {...inputProps}
        />
        {endAdornment === undefined ? null : (
          <div className="absolute inset-y-0 end-0 flex items-center">{endAdornment}</div>
        )}
        {loading === true ? (
          // As wide as the end padding of the field, so the spinner stands in its middle.
          <div className="pointer-events-none absolute inset-y-0 end-0 grid w-11 place-items-center">
            <Spinner />
          </div>
        ) : null}
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
