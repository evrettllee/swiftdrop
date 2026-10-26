import { ChatTextIcon } from '@phosphor-icons/react';
import { type Ref, useId } from 'react';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { CountBadge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { COURIER_CHAT_TEXTS } from '../config/texts';

type CourierChatButtonProps = {
  buttonRef: Ref<HTMLButtonElement>;
  unreadCount: number;
  isChatOpen: boolean;
  chatId: string;
  onToggle: () => void;
};

export function CourierChatButton({
  buttonRef,
  unreadCount,
  isChatOpen,
  chatId,
  onToggle,
}: CourierChatButtonProps) {
  const unreadId = useId();

  return (
    <>
      <Button
        ref={buttonRef}
        variant="secondary"
        aria-label={COURIER_CHAT_TEXTS.CHAT_LABEL}
        aria-describedby={unreadCount > 0 ? unreadId : undefined}
        aria-expanded={isChatOpen}
        aria-controls={isChatOpen ? chatId : undefined}
        onClick={onToggle}
        icon={<ChatTextIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />}
      >
        {COURIER_CHAT_TEXTS.CHAT}
        <CountBadge count={unreadCount} />
      </Button>
      {unreadCount > 0 ? (
        <span id={unreadId} className="sr-only">
          {COURIER_CHAT_TEXTS.unread(unreadCount)}
        </span>
      ) : null}
    </>
  );
}
