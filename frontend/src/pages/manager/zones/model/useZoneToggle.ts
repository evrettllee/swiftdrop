import { useCallback, useRef, useState } from 'react';
import { type ManagerZone, updateManagerZone } from '@/shared/staff-api';
import { showToast } from '@/shared/ui/toast';
import { TOGGLE_TEXTS } from '../config/texts';
import { toZoneFailure, ZONE_FAILURE } from '../lib/zone-failure';

const TOAST_KEY = 'zone-toggle';

function failureToast(error: unknown): { title: string; text: string } {
  const failure = toZoneFailure(error);

  if (failure.kind === ZONE_FAILURE.CHANGED) {
    return { title: TOGGLE_TEXTS.CHANGED, text: TOGGLE_TEXTS.CHANGED_TEXT };
  }

  if (failure.kind === ZONE_FAILURE.RETRY) {
    return { title: TOGGLE_TEXTS.FAILED, text: TOGGLE_TEXTS.FAILED_TEXT };
  }

  return { title: TOGGLE_TEXTS.FAILED, text: failure.title };
}

export function useZoneToggle(onChanged: () => void) {
  const [confirming, setConfirming] = useState<ManagerZone | null>(null);
  const [pending, setPending] = useState<ReadonlySet<number>>(() => new Set());
  const inFlight = useRef(new Set<number>());

  const send = useCallback(
    async (zone: ManagerZone, isActive: boolean) => {
      if (inFlight.current.has(zone.id)) {
        return;
      }

      inFlight.current.add(zone.id);
      setPending(new Set(inFlight.current));

      try {
        await updateManagerZone(zone.id, { isActive }, zone.updatedAt);
        showToast({
          key: TOAST_KEY,
          variant: 'success',
          title: isActive ? TOGGLE_TEXTS.TURNED_ON : TOGGLE_TEXTS.TURNED_OFF,
          text: zone.name,
        });
      } catch (error) {
        showToast({ key: TOAST_KEY, variant: 'warning', ...failureToast(error) });
      } finally {
        inFlight.current.delete(zone.id);
        setPending(new Set(inFlight.current));
        onChanged();
      }
    },
    [onChanged],
  );

  function request(zone: ManagerZone, isActive: boolean): void {
    if (isActive) {
      void send(zone, true);
    } else {
      setConfirming(zone);
    }
  }

  function confirm(): void {
    if (confirming !== null) {
      void send(confirming, false);
      setConfirming(null);
    }
  }

  return {
    confirming,
    isPending: (zoneId: number) => pending.has(zoneId),
    request,
    confirm,
    cancel: () => setConfirming(null),
  };
}
