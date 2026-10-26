import { COLOR_TRANSITION_CLASS } from '@/shared/config';
import { CHAT_TEXTS } from '../config/texts';
import { useChat } from './chat-context';

type ChatQuickRepliesProps = {
  replies: readonly string[];
};

export function ChatQuickReplies({ replies }: ChatQuickRepliesProps) {
  const { send, isSending } = useChat();

  return (
    <div
      role="group"
      aria-label={CHAT_TEXTS.QUICK_REPLIES}
      className="flex shrink-0 gap-2 overflow-x-auto px-4 pt-4 [scrollbar-width:none] lg:flex-wrap lg:overflow-visible [&::-webkit-scrollbar]:hidden"
    >
      {replies.map((reply) => (
        <button
          key={reply}
          type="button"
          disabled={isSending}
          onClick={() => void send(reply)}
          className={`inline-flex min-h-11 shrink-0 items-center rounded-md border border-border bg-surface px-3 py-2 text-small whitespace-nowrap text-fg shadow-sm hover:bg-selected disabled:text-fg-muted ${COLOR_TRANSITION_CLASS}`}
        >
          {reply}
        </button>
      ))}
    </div>
  );
}
