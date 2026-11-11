import { expect, test } from '@playwright/test';
import { startedPaymentSchema } from './payment';

function parse(checkoutUrl: string) {
  return startedPaymentSchema.safeParse({ paymentId: 7, checkoutUrl });
}

test('should take an https link of the payment page', () => {
  expect(parse('https://checkout.stripe.com/c/pay/cs_test_a1').success).toBe(true);
});

for (const [name, checkoutUrl] of [
  ['http', 'http://checkout.stripe.com/c/pay/cs_test_a1'],
  ['javascript', 'javascript:alert(1)'],
  ['data', 'data:text/html,<p>1</p>'],
  ['a relative path', '/orders/7'],
  ['an empty string', ''],
] as const) {
  test(`should refuse a link by ${name}`, () => {
    expect(parse(checkoutUrl).success).toBe(false);
  });
}
