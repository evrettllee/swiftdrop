import { PaperPlaneRightIcon } from '@phosphor-icons/react';
import { type FormEvent, type ReactNode, useId } from 'react';
import { CHAT_UI_TEXTS, COLOR_TRANSITION_CLASS, ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { FieldError } from '@/shared/ui/field-error';
import { isSendableText, limitMessageText } from './message-text';

type ChatComposerFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  isSending: boolean;
  error: ReactNode;
  autoFocus?: boolean;
  onChange: (text: string) => void;
  onSubmit: () => void;
};

export function ChatComposerField({
  label,
  placeholder,
  value,
  isSending,
  error,
  autoFocus = false,
  onChange,
  onSubmit,
}: ChatComposerFieldProps) {
  const errorId = useId();
  const hasError = error !== null && error !== undefined;
  const canSubmit = isSendableText(value) && !isSending;

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    if (canSubmit) {
      onSubmit();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex shrink-0 flex-col gap-2 p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] lg:pb-4"
    >
      <div className="flex items-center gap-2">
        <input
          autoFocus={autoFocus}
          type="text"
          value={value}
          onChange={(event) => onChange(limitMessageText(event.target.value))}
          placeholder={placeholder}
          aria-label={label}
          aria-invalid={hasError ? true : undefined}
          aria-describedby={hasError ? errorId : undefined}
          enterKeyHint="send"
          autoComplete="off"
          className="h-11 min-w-0 flex-1 rounded-sm border border-border bg-surface px-3 text-body text-fg shadow-sm placeholder:text-fg-muted focus:border-accent"
        />
        <button
          type="submit"
          aria-label={CHAT_UI_TEXTS.SEND}
          aria-busy={isSending || undefined}
          disabled={!canSubmit}
          className={`grid size-11 shrink-0 place-items-center rounded-md bg-primary text-on-primary shadow-sm hover:bg-primary-hover active:bg-primary-pressed disabled:bg-border disabled:text-fg-muted disabled:shadow-none dark:disabled:border dark:disabled:border-border dark:disabled:bg-surface-muted ${COLOR_TRANSITION_CLASS}`}
        >
          <PaperPlaneRightIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />
        </button>
      </div>
      {hasError ? <FieldError id={errorId}>{error}</FieldError> : null}
    </form>
  );
}
