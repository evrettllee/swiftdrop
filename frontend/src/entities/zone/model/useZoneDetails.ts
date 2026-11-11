import { useCallback, useEffect, useState } from 'react';
import { ApiError, HTTP_STATUS } from '@/shared/api';
import { getManagerZone, type ManagerZoneDetails } from '@/shared/staff-api';

export const DETAILS_STATUS = {
  LOADING: 'loading',
  READY: 'ready',
  NOT_FOUND: 'not_found',
  FAILED: 'failed',
} as const;

type DetailsStatus = (typeof DETAILS_STATUS)[keyof typeof DETAILS_STATUS];

type DetailsAnswer = {
  zoneId: number;
  attempt: number;
  zone: ManagerZoneDetails | null;
  status: DetailsStatus;
};

export function useZoneDetails(zoneId: number | null) {
  const [attempt, setAttempt] = useState(0);
  const [answer, setAnswer] = useState<DetailsAnswer | null>(null);
  const reload = useCallback(() => setAttempt((current) => current + 1), []);

  useEffect(() => {
    if (zoneId === null) {
      return undefined;
    }

    const controller = new AbortController();

    getManagerZone(zoneId, { signal: controller.signal }).then(
      (zone) => setAnswer({ zoneId, attempt, zone, status: DETAILS_STATUS.READY }),
      (error: unknown) => {
        if (!controller.signal.aborted) {
          const isMissing = error instanceof ApiError && error.status === HTTP_STATUS.NOT_FOUND;
          setAnswer({
            zoneId,
            attempt,
            zone: null,
            status: isMissing ? DETAILS_STATUS.NOT_FOUND : DETAILS_STATUS.FAILED,
          });
        }
      },
    );

    return () => controller.abort();
  }, [zoneId, attempt]);

  const isCurrent = answer !== null && answer.zoneId === zoneId;
  const isFresh = isCurrent && answer.attempt === attempt;

  return {
    zone: isCurrent ? answer.zone : null,
    status: isFresh ? answer.status : DETAILS_STATUS.LOADING,
    reload,
  };
}
