import { HTTP_STATUS, NETWORK_ERROR_STATUS, SERVER_ERROR_STATUS_MIN } from './request-config';

// A failure that may pass by itself, so asking again makes sense: the network, a limit, the server.
// A refused request (4xx) would be refused again.
export function isTransientStatus(status: number): boolean {
  return (
    status === NETWORK_ERROR_STATUS ||
    status === HTTP_STATUS.TOO_MANY_REQUESTS ||
    status >= SERVER_ERROR_STATUS_MIN
  );
}
