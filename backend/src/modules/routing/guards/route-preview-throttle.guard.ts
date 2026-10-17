import { type CanActivate, type ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { ThrottlerException, ThrottlerStorage } from '@nestjs/throttler';
import type { Request } from 'express';
import {
  DEFAULT_THROTTLER_NAME,
  THROTTLE_ERROR_MESSAGE,
} from '../../../common/constants/http.constants';
import type { AuthUser } from '../../auth/types/auth.types';
import {
  ROUTE_PREVIEW_GUEST_THROTTLE_LIMIT,
  ROUTE_PREVIEW_THROTTLE_KEY,
  ROUTING_THROTTLE_LIMIT,
  ROUTING_THROTTLE_TTL_MS,
} from '../constants/routing.constants';

const AUDIENCE = { GUEST: 'guest', USER: 'user' } as const;

// The preview is public, so a guest gets a stricter limit than a signed-in user. The global
// throttler runs before the session is read and cannot tell them apart: the route skips it, and
// this guard runs after OptionalJwtAuthGuard. Both are counted by address, as everywhere.
@Injectable()
export class RoutePreviewThrottleGuard implements CanActivate {
  constructor(@Inject(ThrottlerStorage) private readonly storage: ThrottlerStorage) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthUser | null }>();
    const isGuest = !request.user;
    const limit = isGuest ? ROUTE_PREVIEW_GUEST_THROTTLE_LIMIT : ROUTING_THROTTLE_LIMIT;
    const audience = isGuest ? AUDIENCE.GUEST : AUDIENCE.USER;
    const { isBlocked } = await this.storage.increment(
      `${ROUTE_PREVIEW_THROTTLE_KEY}:${audience}:${request.ip}`,
      ROUTING_THROTTLE_TTL_MS,
      limit,
      ROUTING_THROTTLE_TTL_MS,
      DEFAULT_THROTTLER_NAME,
    );

    if (isBlocked) {
      throw new ThrottlerException(THROTTLE_ERROR_MESSAGE);
    }

    return true;
  }
}
