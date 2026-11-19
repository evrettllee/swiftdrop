import { useCallback, useEffect, useState } from 'react';
import { ApiError, HTTP_STATUS } from '@/shared/api';
import { fetchPasswordLink, type PasswordLink } from '@/shared/session';

export const LINK_STATE = {
  LOADING: 'loading',
  READY: 'ready',
  INVALID: 'invalid',
  FAILED: 'failed',
} as const;

export type LinkState =
  | { status: typeof LINK_STATE.LOADING }
  | { status: typeof LINK_STATE.READY; link: PasswordLink }
  | { status: typeof LINK_STATE.INVALID }
  | { status: typeof LINK_STATE.FAILED };

export function useSetPasswordLink(token: string) {
  const [state, setState] = useState<LinkState>({ status: LINK_STATE.LOADING });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    fetchPasswordLink(token, { signal: controller.signal })
      .then((link) => setState({ status: LINK_STATE.READY, link }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        const isInvalid = error instanceof ApiError && error.status === HTTP_STATUS.NOT_FOUND;
        setState({ status: isInvalid ? LINK_STATE.INVALID : LINK_STATE.FAILED });
      });

    return () => controller.abort();
  }, [token, attempt]);

  const retry = useCallback(() => {
    setState({ status: LINK_STATE.LOADING });
    setAttempt((current) => current + 1);
  }, []);
  const markInvalid = useCallback(() => setState({ status: LINK_STATE.INVALID }), []);

  return { state, retry, markInvalid };
}
