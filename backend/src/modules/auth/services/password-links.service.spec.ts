import { TOKEN_KIND } from '@/common/enums/token-kind.enum';
import { queueDatabase } from '@test/support/queue-database';
import { PASSWORD_LINK_TTL_MS } from '../constants/password-links.constants';
import { hashOpaqueToken } from '../utils/opaque-token';
import { PasswordLinksService, isWellFormedLinkToken } from './password-links.service';
import type { TokensService } from './tokens.service';

const NOW_MS = Date.UTC(2026, 10, 13, 9, 0);
const INPUT = { userId: 7, kind: TOKEN_KIND.INVITE, createdBy: 1 };

describe('PasswordLinksService.issue', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: NOW_MS });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function issueWith() {
    const fake = queueDatabase([[], []]);
    const service = new PasswordLinksService(fake.db, {} as TokensService);

    return { fake, issue: () => service.issue(fake.tx, INPUT) };
  }

  it('should mark the active links used before it inserts the new one', async () => {
    const { fake, issue } = issueWith();

    await issue();

    const methods = fake.calls.map((call) => call.method);

    expect(methods.indexOf('update')).toBeLessThan(methods.indexOf('insert'));
    expect(fake.calls.find((call) => call.method === 'set')?.args[0]).toHaveProperty('usedAt');
  });

  it('should keep only the hash of the token and give the token with its expiry', async () => {
    const { fake, issue } = issueWith();

    const { token, expiresAt } = await issue();
    const inserted = fake.calls.find((call) => call.method === 'values')?.args[0];

    expect(isWellFormedLinkToken(token)).toBe(true);
    expect(expiresAt.getTime()).toBe(NOW_MS + PASSWORD_LINK_TTL_MS[TOKEN_KIND.INVITE]);
    expect(inserted).toEqual({
      userId: INPUT.userId,
      kind: INPUT.kind,
      createdBy: INPUT.createdBy,
      tokenHash: hashOpaqueToken(token),
      expiresAt,
    });
    expect(JSON.stringify(inserted)).not.toContain(token);
  });

  it('should give a link 72 hours of life for both kinds', () => {
    expect(PASSWORD_LINK_TTL_MS[TOKEN_KIND.INVITE]).toBe(72 * 60 * 60 * 1000);
    expect(PASSWORD_LINK_TTL_MS[TOKEN_KIND.RESET]).toBe(72 * 60 * 60 * 1000);
  });
});
