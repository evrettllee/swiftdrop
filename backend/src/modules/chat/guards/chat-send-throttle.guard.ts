import { Injectable } from '@nestjs/common';
import { UserThrottleGuard } from '@/common/guards/user-throttle.guard';
import {
  CHAT_ERROR_MESSAGES,
  CHAT_SEND_THROTTLE_KEY,
  CHAT_SEND_THROTTLE_LIMIT,
  CHAT_SEND_THROTTLE_TTL_MS,
} from '../constants/chat.constants';

@Injectable()
export class ChatSendThrottleGuard extends UserThrottleGuard {
  protected readonly options = {
    key: CHAT_SEND_THROTTLE_KEY,
    limit: CHAT_SEND_THROTTLE_LIMIT,
    ttlMs: CHAT_SEND_THROTTLE_TTL_MS,
    message: CHAT_ERROR_MESSAGES.TOO_MANY_MESSAGES,
  };
}
