import {
  ClipboardTextIcon,
  type Icon,
  MapPinIcon,
  PlusCircleIcon,
  UserIcon,
} from '@phosphor-icons/react';
import { UI_TEXTS } from '@/shared/config';
import { APP_ROUTES } from '@/shared/routes';

export const CLIENT_LAYOUT_TEXTS = {
  NAV_LABEL: 'Личный кабинет',
  NAV_ORDERS: UI_TEXTS.ORDERS,
  NAV_NEW_ORDER: UI_TEXTS.NEW_ORDER,
  NAV_ADDRESSES: UI_TEXTS.ADDRESSES,
  NAV_PROFILE: UI_TEXTS.PROFILE,
} as const;

// Where the menu is shown: the sidebar of the desktop or the bottom navigation of a phone.
export const NAV_VARIANT = {
  SIDEBAR: 'sidebar',
  BOTTOM: 'bottom',
} as const;

export type NavVariant = (typeof NAV_VARIANT)[keyof typeof NAV_VARIANT];

type ClientNavItem = {
  to: string;
  label: string;
  icon: Icon;
  // The item is active only on its own address, not on the pages below it.
  isExact: boolean;
};

export const CLIENT_NAV_ITEMS: readonly ClientNavItem[] = [
  {
    to: APP_ROUTES.ORDERS,
    label: CLIENT_LAYOUT_TEXTS.NAV_ORDERS,
    icon: ClipboardTextIcon,
    isExact: false,
  },
  {
    to: APP_ROUTES.ORDER_NEW,
    label: CLIENT_LAYOUT_TEXTS.NAV_NEW_ORDER,
    icon: PlusCircleIcon,
    isExact: true,
  },
  {
    to: APP_ROUTES.ADDRESSES,
    label: CLIENT_LAYOUT_TEXTS.NAV_ADDRESSES,
    icon: MapPinIcon,
    isExact: true,
  },
  { to: APP_ROUTES.PROFILE, label: CLIENT_LAYOUT_TEXTS.NAV_PROFILE, icon: UserIcon, isExact: true },
];
