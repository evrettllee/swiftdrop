import { Logger } from '@nestjs/common';
import { MAIL_KIND } from '../constants/mail.constants';
import { LogMailGateway } from './log-mail.gateway';

describe('LogMailGateway', () => {
  it('should log only the kind of the mail when a mail is suppressed', async () => {
    const log = jest.spyOn(Logger.prototype, 'log').mockImplementation();

    await new LogMailGateway().send({
      kind: MAIL_KIND.PASSWORD_RESET_BY_ADMIN,
      to: 'manager@example.com',
      subject: 'Новый пароль для SwiftDrop',
      text: 'https://swiftdrop.example/set-password/secret-token',
      html: '<p>https://swiftdrop.example/set-password/secret-token</p>',
    });

    const logged = log.mock.calls.flat().join(' ');

    expect(logged).toBe('Mail suppressed: password_reset_by_admin');
    expect(logged).not.toContain('manager@example.com');
    expect(logged).not.toContain('secret-token');
    log.mockRestore();
  });
});
