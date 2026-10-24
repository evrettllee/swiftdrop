import { useEffect, useState } from 'react';
import { PAGE_CLOCK } from '@/shared/lib/clock';
import { startMinuteTicks } from './minute-ticks';

export function useMinuteNow(anchorMs: number | null): number {
  const [, setTicks] = useState(0);

  useEffect(() => {
    if (anchorMs === null) {
      return undefined;
    }

    return startMinuteTicks(PAGE_CLOCK, anchorMs, () => setTicks((ticks) => ticks + 1));
  }, [anchorMs]);

  return PAGE_CLOCK.now();
}
