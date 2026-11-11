import { ClockCounterClockwiseIcon, CubeIcon, LifebuoyIcon, UserIcon } from '@phosphor-icons/react';
import { UI_TEXTS } from '@/shared/config';
import { APP_ROUTES } from '@/shared/routes';
import type { NavItem } from '../account-shell/nav-item';

export const COURIER_LAYOUT_TEXTS = {
  NAV_LABEL: 'Основная навигация',
  NAV_WORK: UI_TEXTS.COURIER_WORK,
  NAV_HISTORY: UI_TEXTS.COURIER_HISTORY,
  NAV_SUPPORT: UI_TEXTS.SUPPORT,
  NAV_PROFILE: UI_TEXTS.PROFILE,
  SENDER: 'Отправитель',
} as const;

const WORK_ITEM: NavItem = {
  to: APP_ROUTES.COURIER_WORK,
  label: COURIER_LAYOUT_TEXTS.NAV_WORK,
  icon: CubeIcon,
  isExact: true,
  // The vehicle is the first step of the work.
  alsoActiveOn: [APP_ROUTES.COURIER_VEHICLE],
};

const HISTORY_ITEM: NavItem = {
  to: APP_ROUTES.COURIER_HISTORY,
  label: COURIER_LAYOUT_TEXTS.NAV_HISTORY,
  icon: ClockCounterClockwiseIcon,
  isExact: true,
  // A finished order is a part of the history.
  alsoActiveOn: [APP_ROUTES.COURIER_HISTORY_ORDER],
};

const PROFILE_ITEM: NavItem = {
  to: APP_ROUTES.COURIER_PROFILE,
  label: COURIER_LAYOUT_TEXTS.NAV_PROFILE,
  icon: UserIcon,
  isExact: true,
};

export const COURIER_NAV_ITEMS: readonly NavItem[] = [
  WORK_ITEM,
  HISTORY_ITEM,
  {
    to: APP_ROUTES.COURIER_SUPPORT,
    label: COURIER_LAYOUT_TEXTS.NAV_SUPPORT,
    icon: LifebuoyIcon,
    isExact: false,
  },
  PROFILE_ITEM,
];

export const COURIER_BOTTOM_NAV_ITEMS: readonly NavItem[] = [
  WORK_ITEM,
  HISTORY_ITEM,
  {
    ...PROFILE_ITEM,
    alsoActiveOn: [APP_ROUTES.COURIER_SUPPORT, APP_ROUTES.COURIER_SUPPORT_TICKET],
  },
];
