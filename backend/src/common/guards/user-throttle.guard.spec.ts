import type { ExecutionContext } from '@nestjs/common';
import { ThrottlerException, type ThrottlerStorage } from '@nestjs/throttler';
import { UserThrottleGuard } from './user-throttle.guard';

class TestThrottleGuard extends UserThrottleGuard {
  protected readonly options = { key: 'test-send', limit: 2, ttlMs: 60_000, message: 'Подождите' };
}

function contextOf(userId: number): ExecutionContext {
  return {
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
  const guard = new TestThrottleGuard({ increment } as unknown as ThrottlerStorage);

  return { guard, increment };
}

describe('UserThrottleGuard', () => {
  it('should count by the counter name and the user with the given limit and window', async () => {
    const { guard, increment } = setUp();

    await guard.canActivate(contextOf(7));

    expect(increment).toHaveBeenCalledWith('test-send:7', 60_000, 2, 60_000, 'default');
  });

  it('should refuse the request over the limit with the given message, per user', async () => {
    const { guard } = setUp();

    await guard.canActivate(contextOf(7));
    await guard.canActivate(contextOf(7));

    await expect(guard.canActivate(contextOf(7))).rejects.toThrow(
      new ThrottlerException('Подождите'),
    );
    await expect(guard.canActivate(contextOf(8))).resolves.toBe(true);
  });
});
