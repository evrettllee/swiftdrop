import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ROLE } from '@/common/enums/role.enum';
import { buildInvitationMail } from '@/modules/auth/mail/invitation.mail';
import { createTestApp } from '@test/support/app';
import { E2E_MAIL_ROUTES, E2eMailController, E2eMailModule } from '@test/support/e2e-mail.module';
import { getApi } from '@test/support/http';
import { mailGatewayOf } from '@test/support/mail';

const ADDRESS = 'invited@example.com';
const LINK = `http://localhost:5173/set-password/${'B'.repeat(43)}`;

function getLastMail(app: NestExpressApplication, to: string) {
  return getApi(app, `${E2E_MAIL_ROUTES.BASE}/${E2E_MAIL_ROUTES.LAST}`).query({
    [E2E_MAIL_ROUTES.RECIPIENT_PARAM]: to,
  });
}

describe('Stand-only mail route (e2e)', () => {
  it('should not exist when the app is built from AppModule alone', async () => {
    const app = await createTestApp();

    try {
      await getLastMail(app, ADDRESS).expect(HttpStatus.NOT_FOUND);
      expect(() => app.get(E2eMailController, { strict: false })).toThrow();
    } finally {
      await app.close();
    }
  });

  it('should give the subject, the text and the link of the last mail when the stand module is added', async () => {
    const app = await createTestApp([], [E2eMailModule]);

    try {
      await getLastMail(app, ADDRESS).expect(HttpStatus.NOT_FOUND);
      await mailGatewayOf(app).send(
        buildInvitationMail({
          to: ADDRESS,
          firstName: 'Павел',
          roleName: ROLE.COURIER,
          link: LINK,
        }),
      );

      const response = await getLastMail(app, ADDRESS).expect(HttpStatus.OK);

      expect(response.body).toMatchObject({ subject: 'Приглашение в SwiftDrop', link: LINK });
      expect(response.body.text).toContain(LINK);
    } finally {
      await app.close();
    }
  });
});
