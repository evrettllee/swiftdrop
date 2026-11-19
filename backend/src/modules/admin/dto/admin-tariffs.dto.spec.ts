import { MONEY_MESSAGES } from '@/common/schemas/money.schema';
import { ADMIN_TARIFF_MESSAGES } from '../constants/admin-tariffs.constants';
import { createTariffSchema, tariffStatusSchema, updateTariffSchema } from './admin-tariffs.dto';

const VALID = { name: ' Экспресс ', pricePerKm: 1.2, pricePerKg: 0.5, minPrice: 6, fragileFee: 3 };

function issuesOf(result: { error?: { issues: { path: PropertyKey[]; message: string }[] } }) {
  return result.error?.issues.map((issue) => [issue.path.join('.'), issue.message]) ?? [];
}

describe('createTariffSchema', () => {
  it('should trim the name and keep the prices with two decimals', () => {
    expect(createTariffSchema.parse(VALID)).toEqual({
      name: 'Экспресс',
      pricePerKm: '1.20',
      pricePerKg: '0.50',
      minPrice: '6.00',
      fragileFee: '3.00',
    });
  });

  it.each([
    ['pricePerKm', 100.01, MONEY_MESSAGES.MAX(100)],
    ['pricePerKg', 101, MONEY_MESSAGES.MAX(100)],
    ['minPrice', 1000.01, MONEY_MESSAGES.MAX(1000)],
    ['fragileFee', 1001, MONEY_MESSAGES.MAX(1000)],
    ['fragileFee', 0, MONEY_MESSAGES.POSITIVE],
    ['pricePerKg', 0.555, MONEY_MESSAGES.TWO_DECIMALS],
  ])('should refuse %s = %p', (field, value, message) => {
    expect(issuesOf(createTariffSchema.safeParse({ ...VALID, [field]: value }))).toEqual([
      [field, message],
    ]);
  });

  it.each([
    ['pricePerKm', 100],
    ['minPrice', 1000],
    ['fragileFee', 1000],
  ])('should take %s at its maximum', (field, value) => {
    expect(createTariffSchema.safeParse({ ...VALID, [field]: value }).success).toBe(true);
  });

  it.each(['А', ' Б ', 'Я'.repeat(51)])('should refuse the name %p', (name) => {
    expect(issuesOf(createTariffSchema.safeParse({ ...VALID, name }))).toEqual([
      ['name', ADMIN_TARIFF_MESSAGES.NAME_LENGTH],
    ]);
  });

  it('should refuse an unknown key and a missing field', () => {
    expect(createTariffSchema.safeParse({ ...VALID, isActive: false }).success).toBe(false);
    expect(createTariffSchema.safeParse({ name: 'Экспресс' }).success).toBe(false);
  });
});

describe('updateTariffSchema', () => {
  it('should keep only the given fields', () => {
    expect(updateTariffSchema.parse({ minPrice: 7.5 })).toEqual({ minPrice: '7.50' });
  });

  it('should ask for at least one field', () => {
    expect(issuesOf(updateTariffSchema.safeParse({}))).toEqual([
      ['', ADMIN_TARIFF_MESSAGES.NOTHING_TO_UPDATE],
    ]);
  });

  it('should refuse isActive in the edit body', () => {
    expect(updateTariffSchema.safeParse({ isActive: true }).success).toBe(false);
  });
});

describe('tariffStatusSchema', () => {
  it.each([true, false])('should take isActive %p', (isActive) => {
    expect(tariffStatusSchema.parse({ isActive })).toEqual({ isActive });
  });

  it.each([{}, { isActive: 'false' }, { isActive: true, name: 'x' }])(
    'should refuse %o',
    (body) => {
      expect(tariffStatusSchema.safeParse(body).success).toBe(false);
    },
  );
});
