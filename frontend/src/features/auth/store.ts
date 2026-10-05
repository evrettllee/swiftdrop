import { create } from 'zustand';
import { setSessionExpiredHandler } from '../../shared/api/http';
import { fetchCurrentUser, login, logout, register } from './api';
import { AUTH_STATUS } from './constants';
import type { AuthStatus, AuthUser, LoginInput, RegisterInput } from './types';

type AuthState = {
  user: AuthUser | null;
  status: AuthStatus;
  initialize: () => Promise<void>;
  signIn: (input: LoginInput) => Promise<void>;
  signUp: (input: RegisterInput) => Promise<void>;
  signOut: () => Promise<void>;
};

// React runs effects twice in development, so the session check is shared between callers.
let initialization: Promise<void> | null = null;

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  status: AUTH_STATUS.LOADING,

  initialize: () => {
    initialization ??= (async () => {
      try {
        const user = await fetchCurrentUser();
        set({ user, status: AUTH_STATUS.AUTHENTICATED });
      } catch {
        set({ user: null, status: AUTH_STATUS.GUEST });
      }
    })();

    return initialization;
  },

  signIn: async (input) => {
    const user = await login(input);
    set({ user, status: AUTH_STATUS.AUTHENTICATED });
  },

  signUp: async (input) => {
    const user = await register(input);
    set({ user, status: AUTH_STATUS.AUTHENTICATED });
  },

  signOut: async () => {
    try {
      await logout();
    } finally {
      set({ user: null, status: AUTH_STATUS.GUEST });
    }
  },
}));

// Called by the HTTP client when a session could not be refreshed in the middle of work.
setSessionExpiredHandler(() => {
  useAuthStore.setState({ user: null, status: AUTH_STATUS.GUEST });
});
