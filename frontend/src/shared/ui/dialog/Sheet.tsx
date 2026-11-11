import { XIcon } from '@phosphor-icons/react';
import { type ReactNode, useId } from 'react';
import { ICON_SIZE, ICON_WEIGHT, UI_TEXTS } from '@/shared/config';
import { IconButton } from '@/shared/ui/icon-button';
import { useModalDialog } from './useModalDialog';

const SHEET_CLASS =
  'fixed inset-x-0 top-auto bottom-0 m-0 max-h-[90dvh] w-full max-w-none overflow-y-auto rounded-t-xl bg-surface text-fg shadow-up backdrop:bg-scrim dark:border dark:border-b-0 dark:border-border ' +
  'transition-[opacity,translate] duration-250 ease-out starting:translate-y-4 starting:opacity-0 motion-reduce:transition-none';

type SheetProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

export function Sheet({ isOpen, onClose, title, children }: SheetProps) {
  const { ref, onClick } = useModalDialog(isOpen, onClose);
  const titleId = useId();

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={onClick}
      className={SHEET_CLASS}
    >
      <div className="flex flex-col px-4 pt-2 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <div aria-hidden="true" className="mx-auto mb-2 h-1 w-10 rounded-full bg-handle" />
        <div className="flex items-center justify-between gap-4 py-1">
          <h2 id={titleId} className="text-heading-sm font-semibold text-balance">
            {title}
          </h2>
          <IconButton aria-label={UI_TEXTS.CLOSE} onClick={onClose} className="-me-3 shrink-0">
            <XIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />
          </IconButton>
        </div>
        <div className="pt-2">{children}</div>
      </div>
    </dialog>
  );
}
