import { LockIcon } from '@phosphor-icons/react';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { CHAT_TEXTS } from '../config/texts';

export function ChatClosedNote() {
  return (
    <p className="flex shrink-0 items-center gap-2 border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-small text-fg-secondary">
      <LockIcon
        size={ICON_SIZE.MEDIUM}
        weight={ICON_WEIGHT}
        aria-hidden="true"
        className="shrink-0"
      />
      {CHAT_TEXTS.CLOSED}
    </p>
  );
}
