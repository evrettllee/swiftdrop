import {
  applyDecorators,
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ThrottlerException, ThrottlerStorage } from '@nestjs/throttler';
import type { Request } from 'express';
import { DEFAULT_THROTTLER_NAME } from '@/common/constants/http.constants';

export type UserThrottleOptions = {
  key: string;
  limit: number;
  ttlMs: number;
  message: string;
};

export const USER_THROTTLE_METADATA = 'swiftdrop:user-throttle';

@Injectable()
export class UserThrottleGuard implements CanActivate {
  constructor(
    @Inject(ThrottlerStorage) private readonly storage: ThrottlerStorage,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<UserThrottleOptions | undefined>(
      USER_THROTTLE_METADATA,
      [context.getHandler(), context.getClass()],
    );

    if (!options) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<Request & { user: { userId: number } }>();
    const { key, limit, ttlMs, message } = options;
    const { isBlocked } = await this.storage.increment(
      `${key}:${user.userId}`,
      ttlMs,
      limit,
      ttlMs,
      DEFAULT_THROTTLER_NAME,
    );

    if (isBlocked) {
      throw new ThrottlerException(message);
    }

    return true;
  }
}

export function UserThrottle(options: UserThrottleOptions) {
  return applyDecorators(
    SetMetadata(USER_THROTTLE_METADATA, options),
    UseGuards(UserThrottleGuard),
  );
}
