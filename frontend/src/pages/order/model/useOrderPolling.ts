import { useEffect, useEffectEvent } from 'react';
import { ORDER_POLL_INTERVAL_MS } from '../config/tracking';

// Calls `onTick` every interval while `isActive`. A hidden tab does not ask: the timer stops, and
// when the tab is back `onTick` is called at once and the timer starts again.
export function useOrderPolling(isActive: boolean, onTick: () => void): void {
  const tick = useEffectEvent(onTick);

  useEffect(() => {
    if (!isActive) {
      return undefined;
    }

    let timer: number | null = null;

    function start(): void {
      timer = window.setInterval(() => tick(), ORDER_POLL_INTERVAL_MS);
    }

    function stop(): void {
      if (timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    function handleVisibility(): void {
      stop();

      if (!document.hidden) {
        tick();
        start();
      }
    }

    if (!document.hidden) {
      start();
    }

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isActive]);
}
