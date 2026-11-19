import { OAUTH_PROVIDER } from '@/common/enums/oauth-provider.enum';
import { PASSWORD_LINK_TOKEN_PARAM } from './password-links.constants';

const CALLBACK_SEGMENT = 'callback';
const PASSWORD_LINKS_SEGMENT = 'password-links';

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
  PASSWORD_LINKS: PASSWORD_LINKS_SEGMENT,
  PASSWORD_LINK: `${PASSWORD_LINKS_SEGMENT}/:${PASSWORD_LINK_TOKEN_PARAM}`,
} as const;
