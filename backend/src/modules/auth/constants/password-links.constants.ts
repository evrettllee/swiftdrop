import { MS_PER_HOUR } from '@/common/constants/time.constants';
import { ROLE } from '@/common/enums/role.enum';
import { TOKEN_KIND, type TokenKind } from '@/common/enums/token-kind.enum';

export const PASSWORD_LINK_TOKEN_BYTES = 32;
export const PASSWORD_LINK_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
export const PASSWORD_LINK_TOKEN_PARAM = 'token';

export const PASSWORD_LINK_TTL_HOURS = 72;

export const PASSWORD_LINK_TTL_MS: Record<TokenKind, number> = {
  [TOKEN_KIND.INVITE]: PASSWORD_LINK_TTL_HOURS * MS_PER_HOUR,
  [TOKEN_KIND.RESET]: PASSWORD_LINK_TTL_HOURS * MS_PER_HOUR,
};

export const PASSWORD_LINK_ROLES = [ROLE.CLIENT, ROLE.COURIER, ROLE.MANAGER] as const;

export type PasswordLinkRole = (typeof PASSWORD_LINK_ROLES)[number];

export const PASSWORD_LINK_INVALID_MESSAGE = 'Ссылка недействительна';

export const PASSWORD_LINK_LOG_MESSAGES = {
  ISSUED: 'Password link issued',
  USED: 'Password set through a link',
  REJECTED: 'Password link rejected',
} as const;
