import { PaperPlaneRightIcon } from '@phosphor-icons/react';
import { type FormEvent, useId, useState } from 'react';
import { COLOR_TRANSITION_CLASS, ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { FieldError } from '@/shared/ui/field-error';
import { CHAT_TEXTS } from '../config/texts';
import { isSendableText, limitMessageText } from '../lib/message-text';
import { useChat } from './chat-context';

type ChatComposerProps = {
  label: string;
  autoFocus?: boolean;
};

export function ChatComposer({ label, autoFocus = false }: ChatComposerProps) {
  const { send, isSending, sendError } = useChat();
  const [text, setText] = useState('');
  const errorId = useId();
  const canSubmit = isSendableText(text) && !isSending;

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (canSubmit && (await send(text))) {
      setText('');
    }
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="flex shrink-0 flex-col gap-2 p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] lg:pb-4"
    >
      <div className="flex items-center gap-2">
        <input
          autoFocus={autoFocus}
          type="text"
          value={text}
          onChange={(event) => setText(limitMessageText(event.target.value))}
          placeholder={CHAT_TEXTS.PLACEHOLDER}
          aria-label={label}
          aria-invalid={sendError === null ? undefined : true}
          aria-describedby={sendError === null ? undefined : errorId}
          enterKeyHint="send"
          autoComplete="off"
          className="h-11 min-w-0 flex-1 rounded-sm border border-border bg-surface px-3 text-body text-fg shadow-sm placeholder:text-fg-muted focus:border-accent"
        />
        <button
          type="submit"
          aria-label={CHAT_TEXTS.SEND}
          aria-busy={isSending || undefined}
          disabled={!canSubmit}
          className={`grid size-11 shrink-0 place-items-center rounded-md bg-primary text-on-primary shadow-sm hover:bg-primary-hover active:bg-primary-pressed disabled:bg-border disabled:text-fg-muted disabled:shadow-none dark:disabled:border dark:disabled:border-border dark:disabled:bg-surface-muted ${COLOR_TRANSITION_CLASS}`}
        >
          <PaperPlaneRightIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />
        </button>
      </div>
      {sendError === null ? null : <FieldError id={errorId}>{sendError}</FieldError>}
    </form>
  );
}
