import { expect, test } from '@playwright/test';
import { APP_ROUTES } from '@/shared/routes';
import { ADMIN_BOTTOM_ITEMS, ADMIN_LAYOUT_TEXTS, ADMIN_SIDEBAR_ITEMS } from './admin-navigation';
import { buildBottomItems, buildSidebarItems, MORE_NAV_ITEMS } from './navigation';

const NO_COUNTS = { attention: 0, awaiting: 0 };

test('should list the users, the tariffs and the analytics in the admin sidebar', () => {
  expect(ADMIN_SIDEBAR_ITEMS.map(({ label, to }) => [label, to])).toEqual([
    ['Пользователи', APP_ROUTES.ADMIN_USERS],
    ['Тарифы', APP_ROUTES.ADMIN_TARIFFS],
    ['Аналитика', APP_ROUTES.ADMIN_ANALYTICS],
  ]);
});

test('should list four items without a more menu in the admin bottom navigation', () => {
  expect(ADMIN_BOTTOM_ITEMS.map(({ label, to }) => [label, to])).toEqual([
    ['Пользователи', APP_ROUTES.ADMIN_USERS],
    ['Тарифы', APP_ROUTES.ADMIN_TARIFFS],
    ['Аналитика', APP_ROUTES.ADMIN_ANALYTICS],
    ['Профиль', APP_ROUTES.ADMIN_PROFILE],
  ]);
});

test('should give the admin no link to a section of the manager', () => {
  for (const { to } of [...ADMIN_SIDEBAR_ITEMS, ...ADMIN_BOTTOM_ITEMS]) {
    expect(to.startsWith(APP_ROUTES.ADMIN)).toBe(true);
  }
});

test('should name the menu and the role of the admin', () => {
  expect(ADMIN_LAYOUT_TEXTS.NAV_LABEL).toBe('Меню администратора');
  expect(ADMIN_LAYOUT_TEXTS.ROLE).toBe('Администратор');
});

test('should keep the menu of the manager as it was', () => {
  expect(buildSidebarItems(NO_COUNTS).map(({ to }) => to)).toEqual([
    APP_ROUTES.MANAGER_ORDERS,
    APP_ROUTES.MANAGER_MAP,
    APP_ROUTES.MANAGER_SUPPORT,
    APP_ROUTES.MANAGER_ZONES,
    APP_ROUTES.MANAGER_ANALYTICS,
  ]);
  expect(buildBottomItems(NO_COUNTS).map(({ to }) => to)).toEqual([
    APP_ROUTES.MANAGER_ORDERS,
    APP_ROUTES.MANAGER_MAP,
    APP_ROUTES.MANAGER_SUPPORT,
  ]);
  expect(MORE_NAV_ITEMS.map(({ to }) => to)).toEqual([
    APP_ROUTES.MANAGER_ZONES,
    APP_ROUTES.MANAGER_ANALYTICS,
    APP_ROUTES.MANAGER_PROFILE,
  ]);
});
