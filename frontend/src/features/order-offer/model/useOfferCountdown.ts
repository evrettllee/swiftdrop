import { useEffect, useEffectEvent, useState } from 'react';
import { MS_PER_SECOND } from '@/shared/config';
import { OFFER_TICK_MS } from '../config/offer';

function getSecondsLeft(deadline: number): number {
  return Math.ceil(Math.max(deadline - Date.now(), 0) / MS_PER_SECOND);
}

// The whole seconds left until `deadline`; `onExpire` is called once when none are left.
export function useOfferCountdown(deadline: number, onExpire: () => void): number {
  const [secondsLeft, setSecondsLeft] = useState(() => getSecondsLeft(deadline));
  const handleExpire = useEffectEvent(onExpire);

  useEffect(() => {
    let timer = 0;

    function tick(): void {
      const left = getSecondsLeft(deadline);
      setSecondsLeft(left);

      if (left === 0) {
        window.clearInterval(timer);
        handleExpire();
      }
    }

    timer = window.setInterval(tick, OFFER_TICK_MS);
    tick();

    return () => window.clearInterval(timer);
  }, [deadline]);

  return secondsLeft;
}
