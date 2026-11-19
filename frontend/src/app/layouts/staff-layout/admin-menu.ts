import { APP_ROUTES } from '@/shared/routes';
import { ADMIN_BOTTOM_ITEMS, ADMIN_LAYOUT_TEXTS, ADMIN_SIDEBAR_ITEMS } from './admin-navigation';
import type { StaffMenu, StaffNav } from './staff-menu';

const ADMIN_NAV: StaffNav = {
  sidebarItems: ADMIN_SIDEBAR_ITEMS,
  bottomItems: ADMIN_BOTTOM_ITEMS,
};

export const ADMIN_MENU: StaffMenu = {
  homeTo: APP_ROUTES.ADMIN_USERS,
  navLabel: ADMIN_LAYOUT_TEXTS.NAV_LABEL,
  userCaption: ADMIN_LAYOUT_TEXTS.ROLE,
  profileTo: APP_ROUTES.ADMIN_PROFILE,
  useNav: () => ADMIN_NAV,
};
