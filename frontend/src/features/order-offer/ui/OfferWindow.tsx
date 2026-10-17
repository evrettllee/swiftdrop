import { type KeyboardEvent, type SyntheticEvent, useId, useLayoutEffect, useRef } from 'react';
import { ESCAPE_KEY } from '@/shared/config';
import { useBodyScrollLock } from '@/shared/lib/dom';
import { useOfferStore } from '../model/offer-store';
import { OfferContent } from './OfferContent';

// A sheet from the bottom on a phone, a centered window on the desktop (design system §10).
const WINDOW_CLASS =
  'fixed inset-x-0 top-auto bottom-0 m-0 w-full max-w-none overflow-y-auto rounded-t-xl border border-b-0 border-transparent bg-surface px-4 pt-2 pb-6 text-fg shadow-up backdrop:bg-scrim lg:inset-0 lg:m-auto lg:h-fit lg:w-120 lg:rounded-lg lg:border-b lg:p-0 lg:shadow-lg dark:border-border dark:bg-surface-muted ' +
  'transition duration-250 ease-out starting:translate-y-4 starting:opacity-0 lg:starting:translate-y-0 lg:starting:scale-98 motion-reduce:transition-none';

// Only an answer closes an offer: neither Escape nor a click on the dimmed page does.
function keepOpen(event: SyntheticEvent): void {
  event.preventDefault();
}

function keepOpenOnEscape(event: KeyboardEvent<HTMLDialogElement>): void {
  if (event.key === ESCAPE_KEY) {
    event.preventDefault();
  }
}

// Built on <dialog>: the browser keeps the focus inside and gives it back to where it was when the
// window closes.
export function OfferWindow() {
  const offer = useOfferStore((state) => state.offer);
  const deadline = useOfferStore((state) => state.deadline);
  const response = useOfferStore((state) => state.response);
  const error = useOfferStore((state) => state.error);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const acceptRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const isOpen = offer !== null;

  // Before the paint, so an empty window never shows.
  useLayoutEffect(() => {
    const dialog = dialogRef.current;

    if (dialog === null) {
      return;
    }

    if (isOpen && !dialog.open) {
      dialog.showModal();
      acceptRef.current?.focus();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useBodyScrollLock(isOpen);

  // The browser may close a window after a repeated Escape anyway: an open offer opens it again.
  function handleClose(): void {
    if (useOfferStore.getState().offer !== null) {
      dialogRef.current?.showModal();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-modal="true"
      onCancel={keepOpen}
      onKeyDown={keepOpenOnEscape}
      onClose={handleClose}
      className={WINDOW_CLASS}
    >
      {offer === null ? null : (
        <OfferContent
          key={offer.offerId}
          offer={offer}
          deadline={deadline}
          response={response}
          error={error}
          titleId={titleId}
          acceptRef={acceptRef}
        />
      )}
    </dialog>
  );
}
