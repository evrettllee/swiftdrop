import type { ReactNode } from 'react';
import { SUPPORT_SEND_FAILURE } from '@/shared/support-api';
import { SEND_FAILURE_TEXTS, SUPPORT_THREAD_TEXTS } from '../config/texts';
import type { SupportSend } from '../model/useSupportSend';

export function supportSendError(send: SupportSend, closedText: string): ReactNode {
  const { failure } = send;

  if (failure === null) {
    return null;
  }

  return failure === SUPPORT_SEND_FAILURE.CLOSED ? (
    closedText
  ) : (
    <>
      {SEND_FAILURE_TEXTS[failure]}
      {failure === SUPPORT_SEND_FAILURE.NETWORK ? (
        <button
          type="button"
          onClick={send.send}
          className="ms-1 font-semibold text-accent underline"
        >
          {SUPPORT_THREAD_TEXTS.RETRY}
        </button>
      ) : null}
    </>
  );
}
