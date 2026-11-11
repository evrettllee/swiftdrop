import { type TextareaHTMLAttributes, useId } from 'react';
import { COLOR_TRANSITION_CLASS, ID_PART } from '@/shared/config';
import { joinClassNames } from '@/shared/lib/class-names';
import { FieldError } from '@/shared/ui/field-error';

type TextAreaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'id' | 'value' | 'maxLength'
> & {
  label: string;
  value: string;
  maxLength: number;
  hint?: string;
  error?: string;
  counterLabel: (length: number, maxLength: number) => string;
};

export function TextArea({
  label,
  value,
  maxLength,
  hint,
  error,
  counterLabel,
  ...rest
}: TextAreaProps) {
  const id = useId();
  const hintId = `${id}-${ID_PART.HINT}`;
  const errorId = `${id}-${ID_PART.ERROR}`;
  const hasError = error !== undefined;
  const describedBy = [hasError ? errorId : null, hint === undefined ? null : hintId]
    .filter((part) => part !== null)
    .join(' ');

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-small font-semibold text-fg">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        maxLength={maxLength}
        aria-invalid={hasError}
        aria-describedby={describedBy === '' ? undefined : describedBy}
        className={joinClassNames(
          'min-h-28 w-full resize-y rounded-sm border bg-surface px-3 py-2 text-body text-fg shadow-sm placeholder:text-fg-muted',
          COLOR_TRANSITION_CLASS,
          hasError ? 'border-danger' : 'border-border focus:border-accent',
        )}
        {...rest}
      />
      {hasError ? <FieldError id={errorId}>{error}</FieldError> : null}
      <div className="flex items-start justify-between gap-4 text-small text-fg-secondary">
        {hint === undefined ? <span /> : <span id={hintId}>{hint}</span>}
        <span className="shrink-0 text-caption tabular-nums">
          {counterLabel(value.length, maxLength)}
        </span>
      </div>
    </div>
  );
}
