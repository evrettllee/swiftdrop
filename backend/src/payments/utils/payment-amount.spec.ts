import { convertBynToUsdMinor, formatMinorAmount } from './payment-amount';

describe('convertBynToUsdMinor', () => {
  it('should return the exact cents when the amount divides by the rate without a remainder', () => {
    expect(convertBynToUsdMinor(10, 2)).toBe(500);
  });

  it('should round up to the next cent when the amount does not divide evenly', () => {
    // 923 kopecks / 3.0371 = 303.9 cents.
    expect(convertBynToUsdMinor(9.23, 3.0371)).toBe(304);
  });

  it('should charge at least one cent when the amount is tiny', () => {
    expect(convertBynToUsdMinor(0.01, 3)).toBe(1);
  });
});

describe('formatMinorAmount', () => {
  it('should format cents as dollars with two digits when the amount is a few cents', () => {
    expect(formatMinorAmount(5)).toBe('0.05');
  });

  it('should format cents as dollars with two digits when the amount is above a dollar', () => {
    expect(formatMinorAmount(304)).toBe('3.04');
  });
});
