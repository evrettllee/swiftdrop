import type { AUTH_TAB } from '@/shared/routes';

export type AuthTabId = (typeof AUTH_TAB)[keyof typeof AUTH_TAB];
