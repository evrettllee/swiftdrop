import { ClockCounterClockwiseIcon, CubeIcon, UserIcon } from '@phosphor-icons/react';
import { UI_TEXTS } from '@/shared/config';
import { APP_ROUTES } from '@/shared/routes';
import type { NavItem } from '../account-shell/nav-item';

export const COURIER_LAYOUT_TEXTS = {
  NAV_LABEL: 'Основная навигация',
  NAV_WORK: UI_TEXTS.COURIER_WORK,
  NAV_HISTORY: UI_TEXTS.COURIER_HISTORY,
  NAV_PROFILE: UI_TEXTS.PROFILE,
} as const;

export const COURIER_NAV_ITEMS: readonly NavItem[] = [
  {
    to: APP_ROUTES.COURIER_WORK,
    label: COURIER_LAYOUT_TEXTS.NAV_WORK,
    icon: CubeIcon,
    isExact: true,
  },
  {
    to: APP_ROUTES.COURIER_HISTORY,
    label: COURIER_LAYOUT_TEXTS.NAV_HISTORY,
    icon: ClockCounterClockwiseIcon,
    isExact: true,
  },
  {
    to: APP_ROUTES.COURIER_PROFILE,
    label: COURIER_LAYOUT_TEXTS.NAV_PROFILE,
    icon: UserIcon,
    isExact: true,
  },
];
