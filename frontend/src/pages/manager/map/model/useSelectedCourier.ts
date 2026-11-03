import { useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { COURIER_PARAM } from '../config/map';

const COURIER_ID_PATTERN = /^[1-9]\d{0,9}$/;

export function useSelectedCourier() {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get(COURIER_PARAM);
  const selectedId = raw !== null && COURIER_ID_PATTERN.test(raw) ? Number(raw) : null;

  const select = useCallback(
    (courierId: number | null) =>
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);

          if (courierId === null) {
            next.delete(COURIER_PARAM);
          } else {
            next.set(COURIER_PARAM, String(courierId));
          }

          return next;
        },
        { replace: true },
      ),
    [setSearchParams],
  );

  return { selectedId, select };
}
