import type { Page, Route } from '@playwright/test';
import { openAsAdmin } from './admin';
import { adminAnalyticsBuilders } from './admin-analytics-fixtures';

export const ADMIN_ANALYTICS_PATH = '/admin/analytics';
export const ADMIN_ANALYTICS_NOW = new Date('2026-11-12T12:00:00.000Z');

const ANALYTICS_ROUTE =
  /\/api\/admin\/analytics\/(business|delivery|users|support|service)(\?.*)?$/;
const EXPORT_ROUTE = /\/api\/admin\/analytics\/export(\?.*)?$/;
const DAY_MS = 24 * 60 * 60 * 1000;

function shift(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

type TabKey = keyof typeof adminAnalyticsBuilders;

export type AdminAnalyticsStub = {
  requests: { tab: TabKey; search: URLSearchParams }[];
  exports: URLSearchParams[];
  failureStatus: number | null;
  exportAnswer: ((route: Route) => Promise<void> | void) | null;
};

export async function stubAdminAnalytics(page: Page): Promise<AdminAnalyticsStub> {
  const stub: AdminAnalyticsStub = {
    requests: [],
    exports: [],
    failureStatus: null,
    exportAnswer: null,
  };

  await openAsAdmin(page);
  await page.clock.setFixedTime(ADMIN_ANALYTICS_NOW);

  await page.route(ANALYTICS_ROUTE, (route) => {
    const url = new URL(route.request().url());
    const tab = url.pathname.split('/').pop() as TabKey;
    const search = url.searchParams;
    const to = search.get('to') ?? '2026-11-12';
    const from = search.get('from') ?? shift(to, -6);

    stub.requests.push({ tab, search });

    if (stub.failureStatus !== null) {
      return route.fulfill({
        status: stub.failureStatus,
        json: { message: 'Слишком много запросов аналитики. Подождите минуту' },
      });
    }

    return route.fulfill({ json: adminAnalyticsBuilders[tab](from, to) });
  });

  await page.route(EXPORT_ROUTE, (route) => {
    const search = new URL(route.request().url()).searchParams;
    stub.exports.push(search);

    if (stub.exportAnswer !== null) {
      return stub.exportAnswer(route);
    }

    const format = search.get('format') === 'csv' ? 'csv' : 'xlsx';

    return route.fulfill({
      body: 'analytics-file',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="swiftdrop-analytics-2026-11-06-2026-11-12.${format}"`,
      },
    });
  });

  return stub;
}
