import { WifiSlashIcon } from '@phosphor-icons/react';
import { CONNECTION_STATUS, useConnectionStatus } from '@/shared/realtime';
import { InlineAlert } from '@/shared/ui/inline-alert';
import { CONNECTION_ALERT_TEXTS } from '../config/texts';

// Offers do not come while the socket is down, so the courier is told so.
export function ConnectionAlert() {
  const status = useConnectionStatus();
  const isReconnecting = status === CONNECTION_STATUS.RECONNECTING;

  return isReconnecting || status === CONNECTION_STATUS.OFFLINE ? (
    <InlineAlert
      variant="warning"
      icon={WifiSlashIcon}
      title={
        isReconnecting
          ? CONNECTION_ALERT_TEXTS.RECONNECTING_TITLE
          : CONNECTION_ALERT_TEXTS.OFFLINE_TITLE
      }
    >
      {isReconnecting
        ? CONNECTION_ALERT_TEXTS.RECONNECTING_HINT
        : CONNECTION_ALERT_TEXTS.OFFLINE_HINT}
    </InlineAlert>
  ) : null;
}
