import type { ReactNode } from 'react';
import type { NavItem } from '../account-shell/nav-item';

export type StaffNav = {
  sidebarItems: readonly NavItem[];
  bottomItems: readonly NavItem[];
  bottomEnd?: ReactNode;
};

export type StaffMenu = {
  homeTo: string;
  navLabel: string;
  userCaption: string;
  profileTo?: string;
  useNav: () => StaffNav;
};
