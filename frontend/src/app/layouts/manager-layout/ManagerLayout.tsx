import { useMemo } from 'react';
import { useAppSocket } from '@/shared/realtime';
import { APP_ROUTES } from '@/shared/routes';
import { ROLE, useAuthStore } from '@/shared/session';
import { ToastViewport } from '@/shared/ui/toast';
import { AccountShell } from '../account-shell/AccountShell';
import { MoreNav } from './MoreNav';
import {
  buildBottomItems,
  buildSidebarItems,
  MANAGER_LAYOUT_TEXTS,
  STAFF_ROLE_LABEL,
} from './navigation';
import { useNavCounts } from './useNavCounts';

export function ManagerLayout() {
  useAppSocket();
  const { attention, awaiting } = useNavCounts();
  const role = useAuthStore((state) => state.user?.role);
  const sidebarItems = useMemo(
    () => buildSidebarItems({ attention, awaiting }),
    [attention, awaiting],
  );
  const bottomItems = useMemo(
    () => buildBottomItems({ attention, awaiting }),
    [attention, awaiting],
  );

  return (
    <>
      <AccountShell
        homeTo={APP_ROUTES.MANAGER_ORDERS}
        navLabel={MANAGER_LAYOUT_TEXTS.NAV_LABEL}
        navItems={sidebarItems}
        bottomNavItems={bottomItems}
        bottomNavEnd={<MoreNav />}
        userCaption={role === ROLE.ADMIN ? STAFF_ROLE_LABEL.admin : STAFF_ROLE_LABEL.manager}
      />
      <ToastViewport />
    </>
  );
}
