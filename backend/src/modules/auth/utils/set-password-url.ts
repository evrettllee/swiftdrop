import { SET_PASSWORD_PATH } from '../constants/mail.constants';

export function buildSetPasswordUrl(appUrl: string, token: string): string {
  return new URL(`${SET_PASSWORD_PATH}/${encodeURIComponent(token)}`, appUrl).toString();
}
