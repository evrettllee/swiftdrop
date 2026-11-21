import { useCallback, useEffect, useState } from 'react';
import { ApiError, HTTP_STATUS } from '@/shared/api';
import { type AdminUserCard, getAdminUserCard } from '../api/admin-user-card';

export const CARD_LOAD = {
  LOADING: 'loading',
  READY: 'ready',
  NOT_FOUND: 'notFound',
  ERROR: 'error',
} as const;

export type CardLoad = (typeof CARD_LOAD)[keyof typeof CARD_LOAD];

type Answer = {
  userId: number;
  attempt: number;
  isNotFound: boolean;
  card: AdminUserCard | null;
};

const MISSING_STATUSES: ReadonlySet<number> = new Set([
  HTTP_STATUS.NOT_FOUND,
  HTTP_STATUS.BAD_REQUEST,
]);

function isMissing(error: unknown): boolean {
  return error instanceof ApiError && MISSING_STATUSES.has(error.status);
}

export function useAdminUserCard(userId: number | null) {
  const [attempt, setAttempt] = useState(0);
  const [answer, setAnswer] = useState<Answer | null>(null);

  useEffect(() => {
    if (userId === null) {
      return undefined;
    }

    const controller = new AbortController();

    getAdminUserCard(userId, controller.signal).then(
      (card) => setAnswer({ userId, attempt, isNotFound: false, card }),
      (error: unknown) => {
        if (!controller.signal.aborted) {
          setAnswer((previous) => ({
            userId,
            attempt,
            isNotFound: isMissing(error),
            card: previous?.userId === userId && !isMissing(error) ? previous.card : null,
          }));
        }
      },
    );

    return () => controller.abort();
  }, [userId, attempt]);

  const reload = useCallback(() => setAttempt((current) => current + 1), []);
  const replace = useCallback(
    (card: AdminUserCard) =>
      setAnswer((previous) => ({
        userId: card.userId,
        attempt: previous?.attempt ?? 0,
        isNotFound: false,
        card,
      })),
    [],
  );
  const isSameUser = userId !== null && answer?.userId === userId;
  const card = isSameUser ? answer.card : null;
  let load: CardLoad = CARD_LOAD.LOADING;

  if (userId === null || (isSameUser && answer.isNotFound)) {
    load = CARD_LOAD.NOT_FOUND;
  } else if (card !== null) {
    load = CARD_LOAD.READY;
  } else if (isSameUser && answer.attempt === attempt) {
    load = CARD_LOAD.ERROR;
  }

  return { load, card, reload, replace };
}
