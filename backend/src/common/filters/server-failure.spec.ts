import { DrizzleQueryError } from 'drizzle-orm';
import { serverFailureMessage } from './server-failure';

describe('serverFailureMessage', () => {
  it('should name the method, the route template and the class of the error', () => {
    expect(
      serverFailureMessage(
        { method: 'POST', route: { path: '/api/orders/:orderId/cancel' } },
        new TypeError("Cannot read properties of undefined (reading 'ivan@example.com')"),
      ),
    ).toBe('POST /api/orders/:orderId/cancel: TypeError');
  });

  it('should keep the parameters of a failed query out of the message', () => {
    const error = new DrizzleQueryError('select 1 where email = $1', ['ivan@example.com']);

    expect(
      serverFailureMessage({ method: 'GET', route: { path: '/api/admin/users/:userId' } }, error),
    ).toBe('GET /api/admin/users/:userId: DrizzleQueryError');
  });

  it('should never use the real address when no route was matched', () => {
    expect(
      serverFailureMessage(
        { method: 'GET', originalUrl: '/api/orders/27.559,53.9006?email=ivan@example.com' },
        'thrown text',
      ),
    ).toBe('GET (no route): UNKNOWN');
  });
});
