import type { Page } from '@playwright/test';
import { AUTH_API_PATHS } from '../../src/shared/api/endpoints/auth';
import { API_BASE_PATH } from '../../src/shared/api/request-config';
import type { Role } from '../../src/shared/session/auth-user';

export const STUB_EMAIL = 'stub-session@example.com';

// The session of the page comes from the stub: no sign-in and no seeded account are needed. The
// app socket of such a page is stubbed too (app-socket.ts).
export async function stubSession(page: Page, role: Role): Promise<void> {
  await page.route(`**${API_BASE_PATH}${AUTH_API_PATHS.ME}`, (route) =>
    route.fulfill({
      json: {
        userId: 990007,
        firstName: 'Анна',
        lastName: 'Тестова',
        email: STUB_EMAIL,
        phone: null,
        role,
      },
    }),
  );
}
