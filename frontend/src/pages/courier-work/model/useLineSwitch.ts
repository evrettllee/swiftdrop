import { useRef, useState } from 'react';
import { setCourierProfile } from '@/entities/courier';
import { type GeoProblem, getCurrentPoint } from '@/features/courier-location';
import { API_ERROR_MESSAGES, getApiErrorMessage } from '@/shared/api';
import type { GeoPoint } from '@/shared/lib/geo';
import { setAvailability } from '../api/set-availability';

export const LINE_SWITCH = {
  ON: 'on',
  OFF: 'off',
} as const;

export type LineSwitch = (typeof LINE_SWITCH)[keyof typeof LINE_SWITCH];

type LineSwitchOptions = {
  // Sends the first position on the line at once.
  sendPoint: (point: GeoPoint) => Promise<void>;
  // The line changed: the results of the day are loaded again.
  onSwitched: (isAvailable: boolean) => void;
};

// Going on and off the line. Going on asks the browser for the position first: without it the
// courier stays off the line and sees why.
export function useLineSwitch({ sendPoint, onSwitched }: LineSwitchOptions) {
  const [pending, setPending] = useState<LineSwitch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [geoProblem, setGeoProblem] = useState<GeoProblem | null>(null);
  // Set at once, so a second press is ignored before any render could mark the buttons busy.
  const isBusy = useRef(false);

  async function run(kind: LineSwitch, task: () => Promise<void>): Promise<void> {
    if (isBusy.current) {
      return;
    }

    isBusy.current = true;
    setPending(kind);
    setError(null);

    try {
      await task();
    } catch (failure) {
      setError(getApiErrorMessage(failure, API_ERROR_MESSAGES.GENERIC));
    } finally {
      isBusy.current = false;
      setPending(null);
    }
  }

  const goOnline = () =>
    run(LINE_SWITCH.ON, async () => {
      setGeoProblem(null);
      const point = await getCurrentPoint();

      if (typeof point === 'string') {
        setGeoProblem(point);
        return;
      }

      setCourierProfile(await setAvailability(true));
      onSwitched(true);
      // The acknowledgement is not awaited: the buttons are free as soon as the line changed.
      void sendPoint(point);
    });

  const goOffline = () =>
    run(LINE_SWITCH.OFF, async () => {
      setCourierProfile(await setAvailability(false));
      onSwitched(false);
    });

  return { pending, error, geoProblem, goOnline, goOffline };
}
