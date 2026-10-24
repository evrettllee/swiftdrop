import { CheckIcon, ChecksIcon } from '@phosphor-icons/react';
import type { ChatMessage } from '@/shared/api';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { joinClassNames } from '@/shared/lib/class-names';
import { formatTime } from '@/shared/lib/format';
import { CHAT_TEXTS } from '../config/texts';

const BUBBLE_CLASS =
  'flex max-w-full flex-col gap-1 rounded-lg border px-4 py-2 lg:max-w-120 [overflow-wrap:anywhere]';
const INCOMING_CLASS = 'self-start rounded-es-sm border-border bg-surface';
const OUTGOING_CLASS = 'self-end rounded-ee-sm border-selected bg-selected dark:border-border';

type ChatBubbleProps = {
  message: ChatMessage;
  isOwn: boolean;
};

export function ChatBubble({ message, isOwn }: ChatBubbleProps) {
  const ReadIcon = message.isRead ? ChecksIcon : CheckIcon;

  return (
    <div className={joinClassNames(BUBBLE_CLASS, isOwn ? OUTGOING_CLASS : INCOMING_CLASS)}>
      <span className="whitespace-pre-wrap">{message.content}</span>
      <span className="flex items-center justify-end gap-1 text-caption text-fg-secondary tabular-nums">
        <time dateTime={message.sentAt.toISOString()}>{formatTime(message.sentAt)}</time>
        {isOwn ? (
          <ReadIcon
            size={ICON_SIZE.SMALL}
            weight={ICON_WEIGHT}
            role="img"
            aria-label={message.isRead ? CHAT_TEXTS.READ : CHAT_TEXTS.SENT}
            className={message.isRead ? 'text-accent' : undefined}
          />
        ) : null}
      </span>
    </div>
  );
}
