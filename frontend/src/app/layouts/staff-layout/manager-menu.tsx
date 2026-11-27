import { useMemo } from 'react';
import { APP_ROUTES } from '@/shared/routes';
import { MoreNav } from './MoreNav';
import { buildBottomItems, buildSidebarItems, MANAGER_LAYOUT_TEXTS } from './navigation';
import type { StaffMenu, StaffNav } from './staff-menu';
import { useNavCounts } from './useNavCounts';

function useManagerNav(): StaffNav {
  const { attention, awaiting } = useNavCounts();

  return useMemo(
    () => ({
      sidebarItems: buildSidebarItems({ attention, awaiting }),
      bottomItems: buildBottomItems({ attention, awaiting }),
      bottomEnd: <MoreNav />,
    }),
    [attention, awaiting],
  );
}

export const MANAGER_MENU: StaffMenu = {
  homeTo: APP_ROUTES.MANAGER_ORDERS,
  navLabel: MANAGER_LAYOUT_TEXTS.NAV_LABEL,
  userCaption: MANAGER_LAYOUT_TEXTS.ROLE,
  useNav: useManagerNav,
};
