import { type CanActivate, type ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { ThrottlerException, ThrottlerStorage } from '@nestjs/throttler';
import type { Request } from 'express';
import { DEFAULT_THROTTLER_NAME } from '../../../common/constants/http.constants';
import type { AuthUser } from '../../auth/types/auth.types';
import {
  CHAT_ERROR_MESSAGES,
  CHAT_SEND_THROTTLE_KEY,
  CHAT_SEND_THROTTLE_LIMIT,
  CHAT_SEND_THROTTLE_TTL_MS,
} from '../constants/chat.constants';

// Messages per user and minute. Runs after the session and the role are checked, before the body
// is read: a refused message never reaches the database.
@Injectable()
export class ChatSendThrottleGuard implements CanActivate {
  constructor(@Inject(ThrottlerStorage) private readonly storage: ThrottlerStorage) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { user } = context.switchToHttp().getRequest<Request & { user: AuthUser }>();
    const { isBlocked } = await this.storage.increment(
      `${CHAT_SEND_THROTTLE_KEY}:${user.userId}`,
      CHAT_SEND_THROTTLE_TTL_MS,
      CHAT_SEND_THROTTLE_LIMIT,
      CHAT_SEND_THROTTLE_TTL_MS,
      DEFAULT_THROTTLER_NAME,
    );

    if (isBlocked) {
      throw new ThrottlerException(CHAT_ERROR_MESSAGES.TOO_MANY_MESSAGES);
    }

    return true;
  }
}
