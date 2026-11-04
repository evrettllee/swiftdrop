import { CursorIcon } from '@phosphor-icons/react';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';

type DrawHintProps = { text: string | null; isTouch: boolean };

export function DrawHint({ text, isTouch }: DrawHintProps) {
  if (text === null) {
    return null;
  }

  return (
    <p
      role="status"
      className={
        isTouch
          ? 'absolute start-3 end-16 top-3 z-1000 rounded-md border border-border bg-surface px-3 py-2 text-small text-fg shadow-sm'
          : 'absolute start-1/2 top-3 z-1000 flex -translate-x-1/2 items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-small whitespace-nowrap text-fg shadow-sm'
      }
    >
      {isTouch ? null : (
        <CursorIcon
          size={ICON_SIZE.SMALL}
          weight={ICON_WEIGHT}
          aria-hidden="true"
          className="text-fg-secondary"
        />
      )}
      {text}
    </p>
  );
}
