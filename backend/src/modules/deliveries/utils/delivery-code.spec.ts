import { generateDeliveryCode } from './delivery-code';

const SAMPLES = 200;
const FOUR_DIGITS = /^[0-9]{4}$/;

describe('generateDeliveryCode', () => {
  it('should always return exactly four digits', () => {
    const codes = Array.from({ length: SAMPLES }, () => generateDeliveryCode());

    expect(codes.every((code) => FOUR_DIGITS.test(code))).toBe(true);
  });
});
