import { Logger } from '@nestjs/common';
import { MAIL_KIND } from '../constants/mail.constants';
import { MailDeliveryError } from '../errors/mail-delivery.error';
import type { MailMessage } from '../types/mail.types';
import { SmtpMailGateway } from './smtp-mail.gateway';

const FROM = 'SwiftDrop <no-reply@swiftdrop.example>';
const MESSAGE: MailMessage = {
  kind: MAIL_KIND.INVITATION,
  to: 'courier@example.com',
  subject: 'Приглашение в SwiftDrop',
  text: 'https://swiftdrop.example/set-password/secret-token',
  html: '<p>https://swiftdrop.example/set-password/secret-token</p>',
};

describe('SmtpMailGateway', () => {
  const sendMail = jest.fn<Promise<unknown>, [unknown]>();
  const gateway = new SmtpMailGateway({ sendMail }, FROM);
  let errorLog: jest.SpyInstance;

  beforeEach(() => {
    sendMail.mockReset();
    errorLog = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    errorLog.mockRestore();
  });

  it('should pass the message and the sender to the transport when a mail is sent', async () => {
    sendMail.mockResolvedValue({});

    await gateway.send(MESSAGE);

    expect(sendMail).toHaveBeenCalledWith({
      from: FROM,
      to: MESSAGE.to,
      subject: MESSAGE.subject,
      text: MESSAGE.text,
      html: MESSAGE.html,
    });
  });

  it('should log only the kind and the code and throw when the transport fails', async () => {
    sendMail.mockRejectedValue(
      Object.assign(new Error(`550 ${MESSAGE.to} rejected`), { code: 'EENVELOPE' }),
    );

    const failure = gateway.send(MESSAGE);

    await expect(failure).rejects.toBeInstanceOf(MailDeliveryError);
    await expect(failure).rejects.toMatchObject({ code: 'EENVELOPE' });
    await expect(failure).rejects.not.toHaveProperty('cause');

    const logged = errorLog.mock.calls.flat().join(' ');

    expect(logged).toContain('invitation');
    expect(logged).toContain('EENVELOPE');
    expect(logged).not.toContain(MESSAGE.to);
    expect(logged).not.toContain('secret-token');
  });
});
