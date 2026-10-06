export const AUTH_TAB = {
  LOGIN: 'login',
  REGISTER: 'register',
} as const;

// The tab to open is chosen by a link: /auth?tab=register
export const AUTH_TAB_QUERY_PARAM = 'tab';

// The backend redirects here after a failed provider login: /auth?error=<code>
export const AUTH_ERROR_QUERY_PARAM = 'error';

export const AUTH_ERROR_CODES = {
  OAUTH_FAILED: 'oauth_failed',
  ACCOUNT_BLOCKED: 'account_blocked',
} as const;

// Title and explanation of the alert above the form, by error code.
export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  [AUTH_ERROR_CODES.OAUTH_FAILED]: 'Не удалось войти через сервис',
  [AUTH_ERROR_CODES.ACCOUNT_BLOCKED]: 'Аккаунт заблокирован',
};

export const AUTH_ERROR_HINTS: Record<string, string> = {
  [AUTH_ERROR_CODES.OAUTH_FAILED]: 'Попробуйте ещё раз или войдите по email и паролю.',
  [AUTH_ERROR_CODES.ACCOUNT_BLOCKED]: 'Обратитесь в поддержку SwiftDrop, чтобы выяснить причину.',
};

// Prefix of the ids that link the tabs and their panels.
export const AUTH_ID_PREFIX = 'auth';
