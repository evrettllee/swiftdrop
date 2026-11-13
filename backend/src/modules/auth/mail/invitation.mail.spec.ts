import { ROLE } from '@/common/enums/role.enum';
import { MAIL_KIND } from '@/integrations/mail/constants/mail.constants';
import { buildInvitationMail } from './invitation.mail';

const LINK = 'https://swiftdrop.example/set-password/abc_DEF-123';
const EXPIRES_AT = new Date('2026-11-13T09:05:00.000Z');
const INPUT = {
  to: 'courier@example.com',
  firstName: 'Иван',
  roleName: ROLE.COURIER,
  link: LINK,
  expiresAt: EXPIRES_AT,
};

describe('buildInvitationMail', () => {
  it('should write the invitation text with the role and the Minsk time when a courier is invited', () => {
    const mail = buildInvitationMail(INPUT);

    expect(mail).toMatchObject({
      kind: MAIL_KIND.INVITATION,
      to: INPUT.to,
      subject: 'Приглашение в SwiftDrop',
    });
    expect(mail.text).toBe(
      `Здравствуйте, Иван! Вас пригласили в SwiftDrop как курьера. Чтобы войти, создайте пароль по ссылке: ${LINK}. Ссылка действует до 13.11.2026 12:05 и только один раз. Если вы не ждали это письмо, просто удалите его.`,
    );
  });

  it('should name the manager role when a manager is invited', () => {
    const mail = buildInvitationMail({ ...INPUT, roleName: ROLE.MANAGER });

    expect(mail.text).toContain('как менеджера.');
    expect(mail.html).toContain('как менеджера.');
  });

  it('should put the link on the button and under it when the html is built', () => {
    const { html } = buildInvitationMail(INPUT);

    expect(html).toContain(`<a href="${LINK}"`);
    expect(html).toContain('>Создать пароль</a>');
    expect(html.split(LINK)).toHaveLength(3);
    expect(html).toContain('13.11.2026 12:05');
    expect(html).not.toMatch(/<img|<link|https?:\/\/(?!swiftdrop\.example)/);
  });

  it('should escape the name in the html when it holds markup', () => {
    const { html, text } = buildInvitationMail({ ...INPUT, firstName: '<b>Иван</b>' });

    expect(html).toContain('Здравствуйте, &lt;b&gt;Иван&lt;/b&gt;!');
    expect(html).not.toContain('<b>');
    expect(text).toContain('Здравствуйте, <b>Иван</b>!');
  });
});
