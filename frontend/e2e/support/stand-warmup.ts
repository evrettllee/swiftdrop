import { chromium } from '@playwright/test';
import { AUTH_API_PATHS } from '../../src/shared/api/endpoints/auth';
import { API_BASE_PATH } from '../../src/shared/api/request-config';
import { APP_ROUTES } from '../../src/shared/routes/app-routes';
import { ROLE, type Role } from '../../src/shared/session/auth-user';

const WARMUP_TIMEOUT_MS = 120_000;

const PAGES_BY_ROLE: [Role, string[]][] = [
  [ROLE.CLIENT, [APP_ROUTES.ORDERS, APP_ROUTES.ORDER_NEW, APP_ROUTES.SUPPORT, '/orders/1']],
  [ROLE.COURIER, [APP_ROUTES.COURIER_WORK, APP_ROUTES.COURIER_HISTORY, '/courier/history/1']],
  [
    ROLE.MANAGER,
    [
      APP_ROUTES.MANAGER_ORDERS,
      '/manager/orders/1',
      APP_ROUTES.MANAGER_MAP,
      APP_ROUTES.MANAGER_SUPPORT,
      APP_ROUTES.MANAGER_ZONES,
      APP_ROUTES.MANAGER_ZONE_NEW,
      APP_ROUTES.MANAGER_ANALYTICS,
    ],
  ],
];

export async function warmUpPages(baseURL: string): Promise<void> {
  const browser = await chromium.launch();

  try {
    for (const [role, paths] of PAGES_BY_ROLE) {
      const page = await browser.newPage({ baseURL });
      await page.route(new RegExp(`^https?://[^/]+${API_BASE_PATH}/`), (route) =>
        route.fulfill({ status: 404, json: { message: 'Не найдено' } }),
      );
      await page.route(`**${API_BASE_PATH}${AUTH_API_PATHS.ME}`, (route) =>
        route.fulfill({
          json: {
            userId: 1,
            firstName: 'Анна',
            lastName: 'Тестова',
            email: 'warmup@swiftdrop.test',
            phone: null,
            role,
          },
        }),
      );

      for (const path of paths) {
        await page.goto(path, { timeout: WARMUP_TIMEOUT_MS });
        await page.waitForLoadState('networkidle', { timeout: WARMUP_TIMEOUT_MS });
      }

      await page.close();
    }
  } finally {
    await browser.close();
  }
}
