import type { ExecutionContext } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { ThrottlerException, type ThrottlerStorage } from '@nestjs/throttler';
import { UserThrottle, UserThrottleGuard } from './user-throttle.guard';

const SEND_LIMIT = { key: 'test-send', limit: 2, ttlMs: 60_000, message: 'Подождите' };
const CLASS_LIMIT = { key: 'test-class', limit: 5, ttlMs: 1_000, message: 'Позже' };

@UserThrottle(CLASS_LIMIT)
class LimitedController {
  @UserThrottle(SEND_LIMIT)
  send(this: void): void {}

  read(this: void): void {}
}

class FreeController {
  open(this: void): void {}
}

function contextOf(
  userId: number,
  controller: new () => object,
  handler: () => void,
): ExecutionContext {
  return {
    getClass: () => controller,
    getHandler: () => handler,
    switchToHttp: () => ({ getRequest: () => ({ user: { userId } }) }),
  } as unknown as ExecutionContext;
}

function setUp() {
  const hits = new Map<string, number>();
  const increment = jest.fn(async (key: string, _ttl: number, limit: number) => {
    const total = (hits.get(key) ?? 0) + 1;
    hits.set(key, total);

    return { totalHits: total, timeToExpire: 60, isBlocked: total > limit, timeToBlockExpire: 60 };
  });
  const guard = new UserThrottleGuard(
    { increment } as unknown as ThrottlerStorage,
    new Reflector(),
  );

  return { guard, increment };
}

const { send, read } = LimitedController.prototype;
const { open } = FreeController.prototype;

describe('UserThrottle', () => {
  it('should attach the shared guard to the method and the class', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, send)).toEqual([UserThrottleGuard]);
    expect(Reflect.getMetadata(GUARDS_METADATA, LimitedController)).toEqual([UserThrottleGuard]);
  });

  it('should count by the counter name and the user with the given limit and window', async () => {
    const { guard, increment } = setUp();

    await guard.canActivate(contextOf(7, LimitedController, send));

    expect(increment).toHaveBeenCalledWith('test-send:7', 60_000, 2, 60_000, 'default');
  });

  it('should take the limit of the class for a method without its own', async () => {
    const { guard, increment } = setUp();

    await guard.canActivate(contextOf(7, LimitedController, read));

    expect(increment).toHaveBeenCalledWith('test-class:7', 1_000, 5, 1_000, 'default');
  });

  it('should refuse the request over the limit with the given message, per user', async () => {
    const { guard } = setUp();

    await guard.canActivate(contextOf(7, LimitedController, send));
    await guard.canActivate(contextOf(7, LimitedController, send));

    await expect(guard.canActivate(contextOf(7, LimitedController, send))).rejects.toThrow(
      new ThrottlerException('Подождите'),
    );
    await expect(guard.canActivate(contextOf(8, LimitedController, send))).resolves.toBe(true);
  });

  it('should let a route without a limit through without counting', async () => {
    const { guard, increment } = setUp();

    await expect(guard.canActivate(contextOf(7, FreeController, open))).resolves.toBe(true);
    expect(increment).not.toHaveBeenCalled();
  });
});
