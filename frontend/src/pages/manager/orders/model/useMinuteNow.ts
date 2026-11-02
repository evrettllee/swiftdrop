import { useEffect, useState } from 'react';
import { MS_PER_MINUTE } from '@/shared/config';

export function useMinuteNow(): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), MS_PER_MINUTE);

    return () => window.clearInterval(timer);
  }, []);

  return now;
}
