import { create } from 'zustand';

export const CONNECTION_STATUS = {
  // The first attempt after the cabinet was opened.
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  // The connection was lost and socket.io (or a refreshed session) is bringing it back.
  RECONNECTING: 'reconnecting',
  // No connection and no attempt: the cabinet is closed or the backend refused the socket.
  OFFLINE: 'offline',
} as const;

export type ConnectionStatus = (typeof CONNECTION_STATUS)[keyof typeof CONNECTION_STATUS];

type ConnectionState = {
  status: ConnectionStatus;
};

export const useConnectionStore = create<ConnectionState>()(() => ({
  status: CONNECTION_STATUS.OFFLINE,
}));

export function setConnectionStatus(status: ConnectionStatus): void {
  useConnectionStore.setState({ status });
}

export function useConnectionStatus(): ConnectionStatus {
  return useConnectionStore((state) => state.status);
}
