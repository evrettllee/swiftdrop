import type { TokenKind } from '@/common/enums/token-kind.enum';
import type { PasswordLinkRole } from '../constants/password-links.constants';

export type IssuePasswordLinkInput = {
  userId: number;
  kind: TokenKind;
  createdBy: number | null;
};

export type IssuedPasswordLink = {
  token: string;
  expiresAt: Date;
};

export type PasswordLinkInfo = {
  kind: TokenKind;
  firstName: string;
  email: string;
  role: PasswordLinkRole;
};
