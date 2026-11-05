import { useEffect, useEffectEvent, useRef } from 'react';
import { CONNECTION_STATUS, useConnectionStatus } from './connection-status';

export function useSocketReconnect(onReconnect: () => void): void {
  const connection = useConnectionStatus();
  const previous = useRef(connection);
  const hasBeenConnected = useRef(false);
  const handleReconnect = useEffectEvent(onReconnect);

  useEffect(() => {
    const isConnected = connection === CONNECTION_STATUS.CONNECTED;
    const isReturn =
      isConnected && previous.current !== CONNECTION_STATUS.CONNECTED && hasBeenConnected.current;
    previous.current = connection;

    if (isReturn) {
      handleReconnect();
    }

    if (isConnected) {
      hasBeenConnected.current = true;
    }
  }, [connection]);
}
