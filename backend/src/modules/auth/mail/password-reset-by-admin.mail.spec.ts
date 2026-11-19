import { MAIL_KIND } from '@/integrations/mail/constants/mail.constants';
import { buildPasswordResetByAdminMail } from './password-reset-by-admin.mail';

const LINK = 'https://swiftdrop.example/set-password/xyz';
const INPUT = {
  to: 'manager@example.com',
  firstName: 'Елена',
  link: LINK,
  expiresAt: new Date('2026-12-31T21:30:00.000Z'),
};

describe('buildPasswordResetByAdminMail', () => {
  it('should write the reset text with the Minsk time when an admin resets a password', () => {
    const mail = buildPasswordResetByAdminMail(INPUT);

    expect(mail).toMatchObject({
      kind: MAIL_KIND.PASSWORD_RESET_BY_ADMIN,
      to: INPUT.to,
      subject: 'Новый пароль для SwiftDrop',
    });
    expect(mail.text).toBe(
      `Здравствуйте, Елена! Администратор сбросил ваш пароль, старый больше не работает. Создайте новый по ссылке: ${LINK}. Ссылка действует до 01.01.2027 00:30 и только один раз.`,
    );
  });

  it('should put the link on the button and under it when the html is built', () => {
    const { html } = buildPasswordResetByAdminMail(INPUT);

    expect(html).toContain(`<a href="${LINK}"`);
    expect(html.split(LINK)).toHaveLength(3);
    expect(html).toContain('01.01.2027 00:30');
    expect(html).toContain('background:#1E3A8A');
  });

  it('should escape the name and the link in the html when they hold markup', () => {
    const { html } = buildPasswordResetByAdminMail({
      ...INPUT,
      firstName: '<b>Иван</b>',
      link: 'https://swiftdrop.example/set-password/"><script>',
    });

    expect(html).toContain('&lt;b&gt;Иван&lt;/b&gt;');
    expect(html).toContain('set-password/&quot;&gt;&lt;script&gt;');
    expect(html).not.toContain('<script>');
  });
});
