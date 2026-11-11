import { OAUTH_PROVIDER } from '@/common/enums/oauth-provider.enum';

const CALLBACK_SEGMENT = 'callback';

export const AUTH_ROUTES = {
  BASE: 'auth',
  REGISTER: 'register',
  LOGIN: 'login',
  REFRESH: 'refresh',
  LOGOUT: 'logout',
  ME: 'me',
  GOOGLE: OAUTH_PROVIDER.GOOGLE,
  GOOGLE_CALLBACK: `${OAUTH_PROVIDER.GOOGLE}/${CALLBACK_SEGMENT}`,
  YANDEX: OAUTH_PROVIDER.YANDEX,
  YANDEX_CALLBACK: `${OAUTH_PROVIDER.YANDEX}/${CALLBACK_SEGMENT}`,
} as const;
