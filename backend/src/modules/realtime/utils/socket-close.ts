import type { Socket } from 'socket.io';

// Closes the socket once the answer to the message being handled is out: the answer goes when the
// handler resolves, and this runs on a later turn of the event loop, so the client reads the
// reason before the connection drops.
export function closeAfterAnswer(socket: Socket): void {
  setImmediate(() => socket.disconnect(true));
}
