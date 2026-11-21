import { useId } from 'react';
import { COLOR_TRANSITION_CLASS, ID_PART } from '@/shared/config';
import { FieldError } from '@/shared/ui/field-error';

type CellFieldProps = {
  label: string;
  value: string;
  error?: string;
  isNumber?: boolean;
  maxLength?: number;
  placeholder: string;
  autoFocus?: boolean;
  onChange: (value: string) => void;
};

export function CellField({
  label,
  value,
  error,
  isNumber = false,
  maxLength,
  placeholder,
  autoFocus = false,
  onChange,
}: CellFieldProps) {
  const errorId = `${useId()}-${ID_PART.ERROR}`;
  const hasError = error !== undefined;

  return (
    <div className="flex flex-col gap-1">
      <input
        type="text"
        inputMode={isNumber ? 'decimal' : undefined}
        aria-label={label}
        aria-invalid={hasError}
        aria-describedby={hasError ? errorId : undefined}
        autoComplete="off"
        autoFocus={autoFocus}
        maxLength={maxLength}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`h-11 rounded-sm border bg-surface px-3 text-body text-fg shadow-sm placeholder:text-fg-muted ${COLOR_TRANSITION_CLASS} ${
          isNumber ? 'w-24 text-end tabular-nums' : 'w-full min-w-40'
        } ${hasError ? 'border-danger' : 'border-border focus:border-accent'}`}
      />
      {hasError ? <FieldError id={errorId}>{error}</FieldError> : null}
    </div>
  );
}
