import type { AUTH_TAB } from './constants/page';
import type { AUTH_STATUS, ROLE_VALUES } from './constants/session';

export type Role = (typeof ROLE_VALUES)[number];
export type AuthStatus = (typeof AUTH_STATUS)[keyof typeof AUTH_STATUS];
export type AuthTabId = (typeof AUTH_TAB)[keyof typeof AUTH_TAB];
