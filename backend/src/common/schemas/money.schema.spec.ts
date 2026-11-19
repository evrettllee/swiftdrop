import { buildMoneySchema, MONEY_MESSAGES } from './money.schema';

const schema = buildMoneySchema(100);

function messagesOf(value: unknown): string[] {
  return schema.safeParse(value).error?.issues.map((issue) => issue.message) ?? [];
}

describe('buildMoneySchema', () => {
  it.each([
    [0.01, '0.01'],
    [1, '1.00'],
    [1.5, '1.50'],
    [12.34, '12.34'],
    [100, '100.00'],
  ])('should take %p as %p', (value, stored) => {
    expect(schema.parse(value)).toBe(stored);
  });

  it.each([0, -1, -0.01, '5', null, Number.NaN, Number.POSITIVE_INFINITY])(
    'should ask for a number above zero for %p',
    (value) => {
      expect(messagesOf(value)).toEqual([MONEY_MESSAGES.POSITIVE]);
    },
  );

  it.each([0.001, 1.005, 12.345, 1e-7])('should refuse more than two decimals in %p', (value) => {
    expect(messagesOf(value)).toEqual([MONEY_MESSAGES.TWO_DECIMALS]);
  });

  it.each([100.01, 101, 1e21])('should refuse %p above the maximum', (value) => {
    expect(messagesOf(value)).toEqual([MONEY_MESSAGES.MAX(100)]);
  });
});
