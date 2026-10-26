import type { AuthUser } from '@/modules/auth/types/auth.types';

// Who opened a socket and until when their access token was valid at that moment.
export type SocketSession = {
  user: AuthUser;
  expiresAtMs: number;
};
