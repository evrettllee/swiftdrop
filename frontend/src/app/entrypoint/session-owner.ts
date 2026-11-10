import { AUTH_STATUS, useAuthStore } from '@/shared/session';

export type SessionState = Pick<ReturnType<typeof useAuthStore.getState>, 'status' | 'user'>;

export function isSessionOwnerChanged(previous: SessionState, state: SessionState): boolean {
  const isSignedOut =
    previous.status === AUTH_STATUS.AUTHENTICATED && state.status === AUTH_STATUS.GUEST;
  const isOtherUser =
    previous.user !== null && state.user !== null && previous.user.userId !== state.user.userId;

  return isSignedOut || isOtherUser;
}
