import { create } from 'zustand';

export const CONNECTION_STATUS = {
  // The first attempt after the cabinet or the order page was opened.
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  // The connection was lost and socket.io (or a refreshed session) is bringing it back.
  RECONNECTING: 'reconnecting',
  // No connection and no attempt: nothing owns the socket or the backend refused it.
  OFFLINE: 'offline',
} as const;

export type ConnectionStatus = (typeof CONNECTION_STATUS)[keyof typeof CONNECTION_STATUS];

type ConnectionState = {
  status: ConnectionStatus;
};

const useConnectionStore = create<ConnectionState>()(() => ({
  status: CONNECTION_STATUS.OFFLINE,
}));

export function setConnectionStatus(status: ConnectionStatus): void {
  useConnectionStore.setState({ status });
}

export function useConnectionStatus(): ConnectionStatus {
  return useConnectionStore((state) => state.status);
}
