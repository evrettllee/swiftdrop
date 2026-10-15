import { useCallback, useEffect, useEffectEvent, useRef } from 'react';
import { type OrderDraftData, saveOrderDraft } from '@/features/order-draft';
import { DOM_EVENT } from '@/shared/config';
import { AUTH_STATUS, useAuthStore } from '@/shared/session';
import { ORDER_DRAFT_SAVE_DELAY_MS } from '../config/draft-autosave';

// Keeps the draft of the order in step with the form, so a reload brings the form back as it was.
// A change is saved after a short pause; a change still waiting is saved at once when the page is
// left or hidden. The draft is written only for a signed-in user: while the session is restored or
// after it ended (then the draft is dropped) nothing is saved. The form does not read the draft
// back, so saving does not render it again.
// Returns `stop`: after the order is placed, nothing waiting or coming is saved any more.
export function useDraftAutosave(data: OrderDraftData): () => void {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const waiting = useRef<OrderDraftData | null>(null);
  const isStopped = useRef(false);
  // A render that changed nothing (an estimate came, a lookup started) is told apart by value. The
  // values the page opened with are the draft already.
  const snapshot = JSON.stringify(data);
  const lastSnapshot = useRef(snapshot);
  const readData = useEffectEvent(() => data);

  const clearTimer = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const flush = useCallback(() => {
    clearTimer();

    const value = waiting.current;
    waiting.current = null;

    if (
      value !== null &&
      !isStopped.current &&
      useAuthStore.getState().status === AUTH_STATUS.AUTHENTICATED
    ) {
      saveOrderDraft(value);
    }
  }, [clearTimer]);

  const stop = useCallback(() => {
    isStopped.current = true;
    clearTimer();
    waiting.current = null;
  }, [clearTimer]);

  useEffect(() => {
    if (isStopped.current || snapshot === lastSnapshot.current) {
      return;
    }

    lastSnapshot.current = snapshot;
    waiting.current = readData();
    clearTimer();
    timer.current = setTimeout(flush, ORDER_DRAFT_SAVE_DELAY_MS);
  }, [snapshot, clearTimer, flush]);

  useEffect(() => {
    window.addEventListener(DOM_EVENT.PAGE_HIDE, flush);

    return () => {
      window.removeEventListener(DOM_EVENT.PAGE_HIDE, flush);
      flush();
    };
  }, [flush]);

  return stop;
}
