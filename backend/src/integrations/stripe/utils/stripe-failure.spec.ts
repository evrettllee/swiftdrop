import Stripe from 'stripe';
import { stripeFailureOf } from './stripe-failure';

describe('stripeFailureOf', () => {
  it('should give the type and the code of a Stripe error, never its text or ids', () => {
    const error = new Stripe.errors.StripeInvalidRequestError({
      type: 'invalid_request_error',
      code: 'resource_missing',
      message: 'No such payment_intent: pi_3PqRsTuVwXyZ012345 for ivan@example.com',
    });

    expect(stripeFailureOf(error)).toEqual({
      code: 'api_error',
      message: 'invalid_request_error resource_missing',
    });
  });

  it('should drop a code that looks like a Stripe id', () => {
    const error = new Stripe.errors.StripeCardError({
      type: 'card_error',
      code: 'cs_test_a1B2c3D4e5F6g7H8',
      message: 'Declined',
    });

    expect(stripeFailureOf(error)).toEqual({ code: 'api_error', message: 'card_error' });
  });

  it('should call a connection that ran out of time a timeout', () => {
    const error = new Stripe.errors.StripeConnectionError({
      message: 'Request aborted due to timeout being reached (10000ms)',
      detail: Object.assign(new TypeError('ETIMEDOUT'), { code: 'ETIMEDOUT' }),
    });

    expect(stripeFailureOf(error)).toEqual({ code: 'timeout', message: 'StripeConnectionError' });
  });

  it('should name an error that is not from Stripe by its class only', () => {
    expect(stripeFailureOf(new RangeError('bad 27.559,53.9006'))).toEqual({
      code: 'api_error',
      message: 'RangeError',
    });
  });
});
