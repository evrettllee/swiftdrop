import {
  ChartBarIcon,
  ClipboardTextIcon,
  LifebuoyIcon,
  MapTrifoldIcon,
  PentagonIcon,
  UserIcon,
} from '@phosphor-icons/react';
import { UI_TEXTS } from '@/shared/config';
import { APP_ROUTES } from '@/shared/routes';
import { ROLE } from '@/shared/session';
import type { NavItem } from '../account-shell/nav-item';

export const MANAGER_LAYOUT_TEXTS = {
  NAV_LABEL: 'Меню менеджера',
  NAV_ORDERS: UI_TEXTS.ORDERS,
  NAV_MAP: 'Карта курьеров',
  NAV_MAP_SHORT: 'Карта',
  NAV_SUPPORT: 'Поддержка',
  NAV_ZONES: 'Зоны',
  NAV_ANALYTICS: 'Аналитика',
  NAV_PROFILE: UI_TEXTS.PROFILE,
  NAV_MORE: 'Ещё',
  attention: (count: number) =>
    `${count} ${count % 10 === 1 && count % 100 !== 11 ? 'требует' : 'требуют'} внимания`,
  awaiting: (count: number) => `${count} без ответа`,
} as const;

export const STAFF_ROLE_LABEL = {
  [ROLE.MANAGER]: 'Менеджер',
  [ROLE.ADMIN]: 'Администратор',
} as const;

export type NavCounts = {
  attention: number;
  awaiting: number;
};

function ordersItem(counts: NavCounts): NavItem {
  return {
    to: APP_ROUTES.MANAGER_ORDERS,
    label: MANAGER_LAYOUT_TEXTS.NAV_ORDERS,
    icon: ClipboardTextIcon,
    isExact: false,
    badge: { count: counts.attention, label: MANAGER_LAYOUT_TEXTS.attention(counts.attention) },
  };
}

function supportItem(counts: NavCounts): NavItem {
  return {
    to: APP_ROUTES.MANAGER_SUPPORT,
    label: MANAGER_LAYOUT_TEXTS.NAV_SUPPORT,
    icon: LifebuoyIcon,
    isExact: false,
    badge: { count: counts.awaiting, label: MANAGER_LAYOUT_TEXTS.awaiting(counts.awaiting) },
  };
}

const ZONES_ITEM: NavItem = {
  to: APP_ROUTES.MANAGER_ZONES,
  label: MANAGER_LAYOUT_TEXTS.NAV_ZONES,
  icon: PentagonIcon,
  isExact: false,
};

const ANALYTICS_ITEM: NavItem = {
  to: APP_ROUTES.MANAGER_ANALYTICS,
  label: MANAGER_LAYOUT_TEXTS.NAV_ANALYTICS,
  icon: ChartBarIcon,
  isExact: true,
};

const MAP_ITEM: NavItem = {
  to: APP_ROUTES.MANAGER_MAP,
  label: MANAGER_LAYOUT_TEXTS.NAV_MAP,
  icon: MapTrifoldIcon,
  isExact: true,
};

export const MORE_NAV_ITEMS: readonly NavItem[] = [
  ZONES_ITEM,
  ANALYTICS_ITEM,
  {
    to: APP_ROUTES.MANAGER_PROFILE,
    label: MANAGER_LAYOUT_TEXTS.NAV_PROFILE,
    icon: UserIcon,
    isExact: true,
  },
];

export function buildSidebarItems(counts: NavCounts): readonly NavItem[] {
  return [ordersItem(counts), MAP_ITEM, supportItem(counts), ZONES_ITEM, ANALYTICS_ITEM];
}

export function buildBottomItems(counts: NavCounts): readonly NavItem[] {
  return [
    ordersItem(counts),
    { ...MAP_ITEM, label: MANAGER_LAYOUT_TEXTS.NAV_MAP_SHORT },
    supportItem(counts),
  ];
}
