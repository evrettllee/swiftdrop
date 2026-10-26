import type { GeoPoint } from '@/shared/lib/geo';
import { closeRefusedSocket, getConnectedSocket, reconnectWithFreshSession } from './app-socket';
import {
  LOCATION_ACK_TIMEOUT_MS,
  type LocationAck,
  locationAckSchema,
  LOCATION_UPDATE_REJECTION,
} from './location-update';
import { SOCKET_EVENTS } from './socket-events';

// Sends a position of the courier and returns the acknowledgement of the backend, or null when the
// socket is not connected or no acknowledgement came in time.
export async function sendCourierLocation(point: GeoPoint): Promise<LocationAck | null> {
  const current = getConnectedSocket();
  let ack: LocationAck | null = null;

  if (current !== null) {
    try {
      const answer: unknown = await current
        .timeout(LOCATION_ACK_TIMEOUT_MS)
        .emitWithAck(SOCKET_EVENTS.LOCATION_UPDATE, point);
      ack = locationAckSchema.parse(answer);
    } catch {
      ack = null;
    }
  }

  if (current !== null && ack?.ok === false) {
    if (ack.reason === LOCATION_UPDATE_REJECTION.SESSION_EXPIRED) {
      // The access token of the socket has expired: the backend closes it at about the same
      // moment, and whichever comes first opens it again with a refreshed session.
      current.disconnect();
      void reconnectWithFreshSession(current);
    } else if (ack.reason === LOCATION_UPDATE_REJECTION.UNAUTHORIZED) {
      closeRefusedSocket(current);
    }
  }

  return ack;
}
