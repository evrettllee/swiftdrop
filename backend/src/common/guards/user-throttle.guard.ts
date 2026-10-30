import { type CanActivate, type ExecutionContext, Inject } from '@nestjs/common';
import { ThrottlerException, ThrottlerStorage } from '@nestjs/throttler';
import type { Request } from 'express';
import { DEFAULT_THROTTLER_NAME } from '@/common/constants/http.constants';

export type UserThrottleOptions = {
  key: string;
  limit: number;
  ttlMs: number;
  message: string;
};

export abstract class UserThrottleGuard implements CanActivate {
  protected abstract readonly options: UserThrottleOptions;

  constructor(@Inject(ThrottlerStorage) private readonly storage: ThrottlerStorage) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { user } = context.switchToHttp().getRequest<Request & { user: { userId: number } }>();
    const { key, limit, ttlMs, message } = this.options;
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
