import { MailDeliveryError } from '../errors/mail-delivery.error';
import { mailFailureOf } from './mail-failure';

describe('mailFailureOf', () => {
  it('should call a mail that ran out of time a timeout', () => {
    expect(mailFailureOf(new MailDeliveryError('ETIMEDOUT'))).toEqual({
      code: 'timeout',
      message: 'ETIMEDOUT',
    });
  });

  it('should give any other failure with its SMTP or Node code only', () => {
    expect(mailFailureOf(new MailDeliveryError('EAUTH'))).toEqual({
      code: 'send_failed',
      message: 'EAUTH',
    });
  });

  it('should never put the address or the link into the message', () => {
    const error = new Error('550 ivan@example.com https://swiftdrop.by/set-password?token=abc');

    expect(mailFailureOf(error)).toEqual({ code: 'send_failed', message: 'Error' });
    expect(mailFailureOf(new MailDeliveryError('ivan@example.com'))).toEqual({
      code: 'send_failed',
      message: 'UNKNOWN',
    });
  });
});
