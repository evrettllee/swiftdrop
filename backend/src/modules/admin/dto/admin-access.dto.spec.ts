import { ADMIN_ACCESS_MESSAGES } from '../constants/admin-access.constants';
import { blockUserSchema } from './admin-access.dto';

function messagesOf(body: unknown): string[] {
  return blockUserSchema.safeParse(body).error?.issues.map((issue) => issue.message) ?? [];
}

describe('blockUserSchema', () => {
  it('should trim the reason', () => {
    expect(blockUserSchema.parse({ reason: '  Жалобы клиентов ' })).toEqual({
      reason: 'Жалобы клиентов',
    });
  });

  it('should take a reason of exactly 500 characters', () => {
    expect(blockUserSchema.parse({ reason: 'я'.repeat(500) }).reason).toHaveLength(500);
  });

  it.each([{}, { reason: '' }, { reason: '   ' }, { reason: 42 }])(
    'should ask for the reason when it is missing or empty: %o',
    (body) => {
      expect(messagesOf(body)).toEqual([ADMIN_ACCESS_MESSAGES.REASON_REQUIRED]);
    },
  );

  it('should refuse a reason longer than 500 characters', () => {
    expect(messagesOf({ reason: 'я'.repeat(501) })).toEqual([
      ADMIN_ACCESS_MESSAGES.REASON_TOO_LONG,
    ]);
  });

  it('should refuse an unknown key', () => {
    expect(blockUserSchema.safeParse({ reason: 'x', until: '2027-01-01' }).success).toBe(false);
  });
});
