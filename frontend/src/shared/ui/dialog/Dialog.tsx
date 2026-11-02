import { XIcon } from '@phosphor-icons/react';
import { type ReactNode, useId } from 'react';
import { ICON_SIZE, ICON_WEIGHT, UI_TEXTS } from '@/shared/config';
import { IconButton } from '@/shared/ui/icon-button';
import { useModalDialog } from './useModalDialog';

// A centered window on the desktop, a sheet from the bottom on a phone (design system §10).
const DIALOG_CLASS =
  'fixed inset-x-0 top-auto bottom-0 m-0 max-h-[90dvh] w-full max-w-none overflow-y-auto rounded-t-xl bg-surface text-fg shadow-up backdrop:bg-scrim lg:inset-0 lg:m-auto lg:h-fit lg:max-w-[calc(100%-2rem)] lg:rounded-lg lg:shadow-lg dark:border dark:border-border ' +
  'transition-[opacity,translate,scale] duration-250 ease-out starting:translate-y-4 starting:opacity-0 lg:starting:translate-y-0 lg:starting:scale-98 motion-reduce:transition-none';

const WIDTH_CLASSES = {
  default: 'lg:w-105',
  wide: 'lg:w-120',
} as const;

type DialogProps = {
  width?: keyof typeof WIDTH_CLASSES;
  isOpen: boolean;
  onClose: () => void;
  title: string;
  // The buttons, the main (or dangerous) one first: it is on top on a phone and on the right
  // on the desktop.
  actions: ReactNode;
  children: ReactNode;
};

// Built on <dialog>: the browser keeps the focus inside, closes it on Escape and gives the focus
// back to the button that opened it. The page under the window does not scroll, and a click on the
// dimmed backdrop closes it.
export function Dialog({
  width = 'default',
  isOpen,
  onClose,
  title,
  actions,
  children,
}: DialogProps) {
  const { ref, onClick } = useModalDialog(isOpen, onClose);
  const titleId = useId();

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={onClick}
      className={`${DIALOG_CLASS} ${WIDTH_CLASSES[width]}`}
    >
      <div className="flex flex-col px-4 pt-2 pb-6 lg:p-0">
        <div
          aria-hidden="true"
          className="mx-auto mb-2 h-1 w-10 rounded-full bg-handle lg:hidden"
        />
        <div className="flex items-center justify-between gap-4 py-1 lg:border-b lg:border-border lg:px-6 lg:py-5">
          <h2 id={titleId} className="text-heading-sm font-semibold text-balance">
            {title}
          </h2>
          <IconButton
            aria-label={UI_TEXTS.CLOSE}
            onClick={onClose}
            className="-me-3 shrink-0 lg:-my-3"
          >
            <XIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />
          </IconButton>
        </div>
        <div className="flex flex-col gap-4 pt-2 pb-6 text-pretty text-fg-secondary lg:p-6">
          {children}
        </div>
        <div className="flex flex-col gap-2 *:w-full lg:flex-row-reverse lg:justify-start lg:gap-3 lg:border-t lg:border-border lg:bg-surface-muted lg:px-6 lg:py-4 lg:*:w-auto">
          {actions}
        </div>
      </div>
    </dialog>
  );
}
