import { ChartBarIcon, TagIcon, UserIcon, UsersIcon } from '@phosphor-icons/react';
import { UI_TEXTS } from '@/shared/config';
import { APP_ROUTES } from '@/shared/routes';
import type { NavItem } from '../account-shell/nav-item';

export const ADMIN_LAYOUT_TEXTS = {
  NAV_LABEL: 'Меню администратора',
  ROLE: 'Администратор',
  NAV_USERS: 'Пользователи',
  NAV_TARIFFS: 'Тарифы',
  NAV_ANALYTICS: 'Аналитика',
  NAV_PROFILE: UI_TEXTS.PROFILE,
} as const;

const USERS_ITEM: NavItem = {
  to: APP_ROUTES.ADMIN_USERS,
  label: ADMIN_LAYOUT_TEXTS.NAV_USERS,
  icon: UsersIcon,
  isExact: false,
};

const TARIFFS_ITEM: NavItem = {
  to: APP_ROUTES.ADMIN_TARIFFS,
  label: ADMIN_LAYOUT_TEXTS.NAV_TARIFFS,
  icon: TagIcon,
  isExact: false,
};

const ANALYTICS_ITEM: NavItem = {
  to: APP_ROUTES.ADMIN_ANALYTICS,
  label: ADMIN_LAYOUT_TEXTS.NAV_ANALYTICS,
  icon: ChartBarIcon,
  isExact: false,
};

const PROFILE_ITEM: NavItem = {
  to: APP_ROUTES.ADMIN_PROFILE,
  label: ADMIN_LAYOUT_TEXTS.NAV_PROFILE,
  icon: UserIcon,
  isExact: true,
};

export const ADMIN_SIDEBAR_ITEMS: readonly NavItem[] = [USERS_ITEM, TARIFFS_ITEM, ANALYTICS_ITEM];

export const ADMIN_BOTTOM_ITEMS: readonly NavItem[] = [
  USERS_ITEM,
  TARIFFS_ITEM,
  ANALYTICS_ITEM,
  PROFILE_ITEM,
];
