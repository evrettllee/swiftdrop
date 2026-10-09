import { buildOrderReturnUrl } from './payment-urls';
import { PAYMENT_RETURN_RESULT } from '../payments.constants';

describe('buildOrderReturnUrl', () => {
  it('should build the order page address with the result when the app address has no trailing slash', () => {
    expect(buildOrderReturnUrl('http://localhost:5173', 42, PAYMENT_RETURN_RESULT.SUCCESS)).toBe(
      'http://localhost:5173/orders/42?payment=success',
    );
  });

  it('should not double the slash when the app address ends with a slash', () => {
    expect(buildOrderReturnUrl('http://localhost:5173/', 42, PAYMENT_RETURN_RESULT.CANCELLED)).toBe(
      'http://localhost:5173/orders/42?payment=cancelled',
    );
  });
});
