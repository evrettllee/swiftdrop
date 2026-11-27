import { PASSWORD_LINK_KIND, type PasswordLink } from '@/shared/session';
import { ROLE_AS } from '../config/texts';

type ExplanationInput = Pick<PasswordLink, 'kind' | 'firstName' | 'role'>;

export function getExplanation({ kind, firstName, role }: ExplanationInput): string {
  if (kind === PASSWORD_LINK_KIND.RESET) {
    return `${firstName}, администратор сбросил ваш пароль. Придумайте новый пароль для входа.`;
  }

  return `${firstName}, вас пригласили в SwiftDrop как ${ROLE_AS[role]}. Придумайте пароль, чтобы войти.`;
}
