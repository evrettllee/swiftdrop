import { ForbiddenException } from '@nestjs/common';
import { OAUTH_ERROR_MESSAGES } from '../constants/oauth.constants';

export class InvitePendingException extends ForbiddenException {
  constructor() {
    super(OAUTH_ERROR_MESSAGES.INVITE_PENDING);
  }
}
