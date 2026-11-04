import { CheckIcon, ChecksIcon } from '@phosphor-icons/react';
import { memo } from 'react';
import { CHAT_UI_TEXTS, ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { joinClassNames } from '@/shared/lib/class-names';
import { formatTime } from '@/shared/lib/format';

const BUBBLE_CLASS =
  'flex max-w-full flex-col gap-1 rounded-lg border px-4 py-2 lg:max-w-120 [overflow-wrap:anywhere]';
const INCOMING_CLASS = 'self-start rounded-es-sm border-border bg-surface';
const OUTGOING_CLASS = 'self-end rounded-ee-sm border-selected bg-selected dark:border-border';

type ChatBubbleProps = {
  text: string;
  sentAt: Date;
  isOwn: boolean;
  isRead: boolean;
  author?: string;
};

export const ChatBubble = memo(function ChatBubble({
  text,
  sentAt,
  isOwn,
  isRead,
  author,
}: ChatBubbleProps) {
  const ReadIcon = isRead ? ChecksIcon : CheckIcon;

  return (
    <div className={joinClassNames(BUBBLE_CLASS, isOwn ? OUTGOING_CLASS : INCOMING_CLASS)}>
      {author === undefined ? null : (
        <span className="text-caption font-semibold text-fg-secondary">{author}</span>
      )}
      <span className="whitespace-pre-wrap">{text}</span>
      <span className="flex items-center justify-end gap-1 text-caption text-fg-secondary tabular-nums">
        <time
          dateTime={sentAt.toISOString()}
          className={isOwn ? 'text-fg dark:text-fg-secondary' : undefined}
        >
          {formatTime(sentAt)}
        </time>
        {isOwn ? (
          <ReadIcon
            size={ICON_SIZE.SMALL}
            weight={ICON_WEIGHT}
            role="img"
            aria-label={isRead ? CHAT_UI_TEXTS.READ : CHAT_UI_TEXTS.SENT}
            className={isRead ? 'text-accent' : undefined}
          />
        ) : null}
      </span>
    </div>
  );
});
