import {
  ClipboardTextIcon,
  LifebuoyIcon,
  MapPinIcon,
  PlusCircleIcon,
  UserIcon,
} from '@phosphor-icons/react';
import { UI_TEXTS } from '@/shared/config';
import { APP_ROUTES } from '@/shared/routes';
import type { NavItem } from '../account-shell/nav-item';

export const CLIENT_LAYOUT_TEXTS = {
  NAV_LABEL: 'Личный кабинет',
  NAV_ORDERS: UI_TEXTS.ORDERS,
  NAV_NEW_ORDER: UI_TEXTS.NEW_ORDER,
  NAV_ADDRESSES: UI_TEXTS.ADDRESSES,
  NAV_SUPPORT: UI_TEXTS.SUPPORT,
  NAV_PROFILE: UI_TEXTS.PROFILE,
} as const;

const ORDERS_ITEM: NavItem = {
  to: APP_ROUTES.ORDERS,
  label: CLIENT_LAYOUT_TEXTS.NAV_ORDERS,
  icon: ClipboardTextIcon,
  isExact: false,
};

const NEW_ORDER_ITEM: NavItem = {
  to: APP_ROUTES.ORDER_NEW,
  label: CLIENT_LAYOUT_TEXTS.NAV_NEW_ORDER,
  icon: PlusCircleIcon,
  isExact: true,
};

const ADDRESSES_ITEM: NavItem = {
  to: APP_ROUTES.ADDRESSES,
  label: CLIENT_LAYOUT_TEXTS.NAV_ADDRESSES,
  icon: MapPinIcon,
  isExact: true,
};

const PROFILE_ITEM: NavItem = {
  to: APP_ROUTES.PROFILE,
  label: CLIENT_LAYOUT_TEXTS.NAV_PROFILE,
  icon: UserIcon,
  isExact: true,
};

export const CLIENT_NAV_ITEMS: readonly NavItem[] = [
  ORDERS_ITEM,
  NEW_ORDER_ITEM,
  ADDRESSES_ITEM,
  {
    to: APP_ROUTES.SUPPORT,
    label: CLIENT_LAYOUT_TEXTS.NAV_SUPPORT,
    icon: LifebuoyIcon,
    isExact: false,
  },
  PROFILE_ITEM,
];

export const CLIENT_BOTTOM_NAV_ITEMS: readonly NavItem[] = [
  ORDERS_ITEM,
  NEW_ORDER_ITEM,
  ADDRESSES_ITEM,
  { ...PROFILE_ITEM, alsoActiveOn: [APP_ROUTES.SUPPORT, APP_ROUTES.SUPPORT_TICKET] },
];
