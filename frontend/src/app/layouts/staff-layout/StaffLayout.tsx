import { useAppSocket } from '@/shared/realtime';
import { ToastViewport } from '@/shared/ui/toast';
import { AccountShell } from '../account-shell/AccountShell';
import type { StaffMenu } from './staff-menu';

type StaffLayoutProps = {
  menu: StaffMenu;
};

export function StaffLayout({ menu }: StaffLayoutProps) {
  useAppSocket();
  const { sidebarItems, bottomItems, bottomEnd } = menu.useNav();

  return (
    <>
      <AccountShell
        homeTo={menu.homeTo}
        navLabel={menu.navLabel}
        navItems={sidebarItems}
        bottomNavItems={bottomItems}
        bottomNavEnd={bottomEnd}
        userCaption={menu.userCaption}
        profileTo={menu.profileTo}
      />
      <ToastViewport />
    </>
  );
}
