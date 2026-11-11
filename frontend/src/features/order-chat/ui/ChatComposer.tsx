import { useState } from 'react';
import { ChatComposerField } from '@/shared/ui/chat';
import { CHAT_TEXTS } from '../config/texts';
import { useChat } from './chat-context';

type ChatComposerProps = {
  label: string;
  autoFocus?: boolean;
};

export function ChatComposer({ label, autoFocus = false }: ChatComposerProps) {
  const { send, isSending, sendError } = useChat();
  const [text, setText] = useState('');

  async function handleSubmit(): Promise<void> {
    if (await send(text)) {
      setText('');
    }
  }

  return (
    <ChatComposerField
      label={label}
      placeholder={CHAT_TEXTS.PLACEHOLDER}
      value={text}
      isSending={isSending}
      error={sendError}
      autoFocus={autoFocus}
      onChange={setText}
      onSubmit={() => void handleSubmit()}
    />
  );
}
