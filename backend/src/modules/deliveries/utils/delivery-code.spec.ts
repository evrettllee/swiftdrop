import { deliveryCodesMatch, generateDeliveryCode } from './delivery-code';

const SAMPLES = 200;
const FOUR_DIGITS = /^[0-9]{4}$/;

describe('generateDeliveryCode', () => {
  it('should always return exactly four digits', () => {
    const codes = Array.from({ length: SAMPLES }, () => generateDeliveryCode());

    expect(codes.every((code) => FOUR_DIGITS.test(code))).toBe(true);
  });
});

describe('deliveryCodesMatch', () => {
  it('should match the same code', () => {
    expect(deliveryCodesMatch('0482', '0482')).toBe(true);
  });

  it('should not match a different code', () => {
    expect(deliveryCodesMatch('0482', '0483')).toBe(false);
  });

  it('should not match when the order has no code yet', () => {
    expect(deliveryCodesMatch(null, '0482')).toBe(false);
  });
});
