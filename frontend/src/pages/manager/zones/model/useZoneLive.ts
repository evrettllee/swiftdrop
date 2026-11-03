import { useEffect, useEffectEvent } from 'react';
import { onTypedSocketEvent, SOCKET_EVENTS } from '@/shared/realtime';

export function useZoneLive(zoneId: number | null, onChange: () => void): void {
  const handleChange = useEffectEvent(onChange);

  useEffect(() => {
    if (zoneId === null) {
      return undefined;
    }

    return onTypedSocketEvent(SOCKET_EVENTS.STAFF_ZONE, (payload) => {
      if (payload.zoneId === zoneId) {
        handleChange();
      }
    });
  }, [zoneId]);
}
